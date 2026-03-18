import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ChatMessageType } from '../../libs/enums/chat.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { MessagesInquiry, SendMessageInput } from '../../libs/dto/messages-chat/messages-chat.input';
import { MessageChat, MessageChats } from '../../libs/dto/messages-chat/messages-chat';
import { MessageChatUpdate } from '../../libs/dto/messages-chat/messages-chat.update';
import { ChatService } from '../chat/chat.service';
import { T } from '../../libs/types/common';

@Injectable()
export class MessagesChatService {
	constructor(
		@InjectModel('MessageChat') private readonly messageChatModel: Model<MessageChat>,
		private readonly chatService: ChatService,
	) {}

	public async sendMessage(senderId: ObjectId, senderType: MemberType, input: SendMessageInput): Promise<MessageChat> {
		const chat = await this.chatService.getChatById(input.conversationId);
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		const access = this.chatService.getChatAccessContext(chat, senderId, senderType, true);
		this.assertMessagePayload(input);

		if (input.replyToId) {
			const parent = await this.messageChatModel
				.findOne({ _id: input.replyToId, conversationId: input.conversationId, deletedAt: { $exists: false } })
				.lean()
				.exec();
			if (!parent) throw new BadRequestException(Message.NO_DATA_FOUND);
		}

		const result = await this.messageChatModel.create({
			conversationId: input.conversationId,
			senderId,
			senderType,
			messageType: input.messageType,
			message: input.message?.trim() || null,
			attachments: input.attachments ?? [],
			replyToId: input.replyToId ?? null,
			readByMemberIds: [senderId],
		});

		await this.chatService.registerSentMessage(input.conversationId, senderId, access.side, result.toObject());
		return await this.getMessageById(result._id as ObjectId, senderId, senderType);
	}

	public async getMessages(userId: ObjectId, userType: MemberType, input: MessagesInquiry): Promise<MessageChats> {
		const chat = await this.chatService.getChatById(input.conversationId);
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.chatService.getChatAccessContext(chat, userId, userType);

		const match: T = {
			conversationId: input.conversationId,
			deletedAt: { $exists: false },
			deletedForMemberIds: { $nin: [userId] },
		};

		if (input.search?.text) {
			match.message = { $regex: input.search.text, $options: 'i' };
		}

		if (input.search?.messageType) {
			match.messageType = input.search.messageType;
		}

		const sort: T = { createdAt: input?.direction ?? Direction.ASC };

		const result = await this.messageChatModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'members',
									localField: 'senderId',
									foreignField: '_id',
									as: 'senderData',
								},
							},
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'messages',
									localField: 'replyToId',
									foreignField: '_id',
									as: 'parentMessageData',
								},
							},
							{ $unwind: { path: '$parentMessageData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const payload = result[0] ?? { list: [], metaCounter: [] };
		return {
			list: payload.list.map((item: T) => this.enrichMessageForViewer(item, userId)),
			metaCounter: payload.metaCounter.length ? payload.metaCounter : [{ total: 0 }],
		};
	}

	public async updateMessageChat(
		senderId: ObjectId,
		senderType: MemberType,
		input: MessageChatUpdate,
	): Promise<MessageChat> {
		const existing = await this.messageChatModel.findById(input._id).lean().exec();
		if (!existing || existing.deletedAt) throw new NotFoundException(Message.NO_DATA_FOUND);
		if (existing.senderId.toString() !== senderId.toString()) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (existing.messageType !== ChatMessageType.TEXT && input.message) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const result = await this.messageChatModel
			.findOneAndUpdate(
				{ _id: input._id, senderId, deletedAt: { $exists: false } },
				{
					$set: {
						...(typeof input.message !== 'undefined' ? { message: input.message?.trim() || null } : {}),
						...(input.attachments ? { attachments: input.attachments } : {}),
					},
				},
				{ new: true },
			)
			.exec();

		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		const chat = await this.chatService.getChatById(result.conversationId as ObjectId);
		if (chat?.lastMessageId?.toString() === result._id.toString()) {
			await this.chatService.refreshLastMessageSummary(result.conversationId as ObjectId);
		}

		return await this.getMessageById(result._id as ObjectId, senderId, senderType);
	}

	public async removeMessageChat(
		senderId: ObjectId,
		senderType: MemberType,
		messageId: ObjectId,
		deleteForEveryone: boolean,
	): Promise<MessageChat> {
		const existing = await this.messageChatModel.findById(messageId).lean().exec();
		if (!existing || existing.deletedAt) throw new NotFoundException(Message.NO_DATA_FOUND);

		const chat = await this.chatService.getChatById(existing.conversationId as ObjectId);
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.chatService.getChatAccessContext(chat, senderId, senderType);

		if (deleteForEveryone && existing.senderId.toString() !== senderId.toString()) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const update = deleteForEveryone
			? { $set: { deletedAt: new Date() } }
			: { $addToSet: { deletedForMemberIds: new Types.ObjectId(senderId.toString()) } };

		const result = await this.messageChatModel.findOneAndUpdate({ _id: messageId }, update, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.REMOVE_FAILED);

		if (deleteForEveryone && chat.lastMessageId?.toString() === messageId.toString()) {
			await this.chatService.refreshLastMessageSummary(existing.conversationId as ObjectId);
		}

		return this.enrichMessageForViewer(result.toObject(), senderId);
	}

	public async getAllMessagesByAdmin(adminId: ObjectId, input: MessagesInquiry): Promise<MessageChats> {
		return await this.getMessages(adminId, MemberType.ADMIN, input);
	}

	public async removeMessageChatByAdmin(adminId: ObjectId, messageId: ObjectId): Promise<MessageChat> {
		const existing = await this.messageChatModel.findById(messageId).lean().exec();
		if (!existing) throw new NotFoundException(Message.NO_DATA_FOUND);

		const chat = await this.chatService.getChatById(existing.conversationId as ObjectId);
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.chatService.getChatAccessContext(chat, adminId, MemberType.ADMIN);

		const result = await this.messageChatModel.findOneAndUpdate({ _id: messageId }, { $set: { deletedAt: new Date() } }, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.REMOVE_FAILED);

		if (chat.lastMessageId?.toString() === messageId.toString()) {
			await this.chatService.refreshLastMessageSummary(existing.conversationId as ObjectId);
		}

		return this.enrichMessageForViewer(result.toObject(), adminId);
	}

	private async getMessageById(messageId: ObjectId, viewerId: ObjectId, viewerType: MemberType): Promise<MessageChat> {
		const result = await this.messageChatModel
			.aggregate([
				{ $match: { _id: messageId, deletedAt: { $exists: false }, deletedForMemberIds: { $nin: [viewerId] } } },
				{
					$lookup: {
						from: 'members',
						localField: 'senderId',
						foreignField: '_id',
						as: 'senderData',
					},
				},
				{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'messages',
						localField: 'replyToId',
						foreignField: '_id',
						as: 'parentMessageData',
					},
				},
				{ $unwind: { path: '$parentMessageData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		const chat = await this.chatService.getChatById(result[0].conversationId as ObjectId);
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);
		this.chatService.getChatAccessContext(chat, viewerId, viewerType);

		return this.enrichMessageForViewer(result[0], viewerId);
	}

	private enrichMessageForViewer(message: T, viewerId: ObjectId): MessageChat {
		const readByMemberIds = (message.readByMemberIds ?? []).map((id: ObjectId | string) => id.toString());
		const viewerIdStr = viewerId.toString();

		return {
			...message,
			readByMemberIds,
			isReadByMe: readByMemberIds.includes(viewerIdStr) || message.senderId?.toString() === viewerIdStr,
			isOwnMessage: message.senderId?.toString() === viewerIdStr,
		} as MessageChat;
	}

	private assertMessagePayload(input: SendMessageInput): void {
		const hasMessage = Boolean(input.message?.trim());
		const hasAttachments = Boolean(input.attachments?.length);

		if (input.messageType === ChatMessageType.TEXT && !hasMessage) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if ((input.messageType === ChatMessageType.IMAGE || input.messageType === ChatMessageType.FILE) && !hasAttachments) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (!hasMessage && !hasAttachments) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}
}
