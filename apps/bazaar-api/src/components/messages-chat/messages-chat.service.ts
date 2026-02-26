import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { SendMessageInput, MessagesInquiry } from '../../libs/dto/messages-chat/messages-chat.input';
import { MessageChat, MessageChats } from '../../libs/dto/messages-chat/messages-chat';
import { MessageChatUpdate } from '../../libs/dto/messages-chat/messages-chat.update';
import { ChatService } from '../chat/chat.service';
import { SocketGateway } from '../../socket/socket.gateway';
import { T } from '../../libs/types/common';

@Injectable()
export class MessagesChatService {
	constructor(
		@InjectModel('MessageChat') private readonly messageChatModel: Model<MessageChat>,
		private readonly chatService: ChatService,
		private readonly socketGateway: SocketGateway,
	) {}

	/** USER / BRAND — send a message in a conversation */
	public async sendMessage(senderId: ObjectId, input: SendMessageInput): Promise<MessageChat> {
		const { conversationId, message, attachments, replyToId } = input;

		// Verify sender is a participant
		const chat = await this.chatService.getChatById(conversationId);
		if (!chat) throw new BadRequestException(Message.NO_DATA_FOUND);

		const memberIdStr = chat.memberId.toString();
		const brandIdStr = chat.brandId.toString();
		const senderIdStr = senderId.toString();

		if (senderIdStr !== memberIdStr && senderIdStr !== brandIdStr) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		// Validate parent message belongs to the same conversation
		if (replyToId) {
			const parent = await this.messageChatModel.findOne({ _id: replyToId, conversationId }).lean().exec();
			if (!parent) throw new BadRequestException(Message.NO_DATA_FOUND);
		}

		const result = await this.messageChatModel.create({
			conversationId,
			senderId,
			message,
			attachments: attachments ?? [],
			...(replyToId && { replyToId }),
		});

		// Real-time push to the other participant
		const receiverId = senderIdStr === memberIdStr ? brandIdStr : memberIdStr;
		this.socketGateway.emitToUser(receiverId, 'newMessage', result);

		return result;
	}

	/** USER / BRAND — get paginated messages for a conversation */
	public async getMessages(userId: ObjectId, input: MessagesInquiry): Promise<MessageChats> {
		const { conversationId, page, limit } = input;

		// Verify requester is a participant
		const chat = await this.chatService.getChatById(conversationId);
		if (!chat) throw new BadRequestException(Message.NO_DATA_FOUND);

		const userIdStr = userId.toString();
		if (userIdStr !== chat.memberId.toString() && userIdStr !== chat.brandId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const sort: T = { createdAt: input?.direction ?? Direction.ASC };

		const match: T = { conversationId, deletedAt: { $exists: false } };
		if (input.search?.text) {
			match.message = { $regex: input.search.text, $options: 'i' };
		}

		const result = await this.messageChatModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
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

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** USER / BRAND — edit own message content */
	public async updateMessageChat(senderId: ObjectId, input: MessageChatUpdate): Promise<MessageChat> {
		const { _id, message } = input;
		const result = await this.messageChatModel.findOneAndUpdate({ _id, senderId }, { message }, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	/** USER / BRAND — soft-delete own message */
	public async removeMessageChat(senderId: ObjectId, messageId: ObjectId): Promise<MessageChat> {
		const result = await this.messageChatModel
			.findOneAndUpdate({ _id: messageId, senderId }, { deletedAt: new Date() }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	/** ADMIN — all messages across all conversations */
	public async getAllMessagesByAdmin(input: MessagesInquiry): Promise<MessageChats> {
		const sort: T = { createdAt: input?.direction ?? Direction.DESC };

		const result = await this.messageChatModel
			.aggregate([
				{ $match: { conversationId: input.conversationId } },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** ADMIN — hard delete a message */
	public async removeMessageChatByAdmin(messageId: ObjectId): Promise<MessageChat> {
		const result = await this.messageChatModel.findByIdAndDelete(messageId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
