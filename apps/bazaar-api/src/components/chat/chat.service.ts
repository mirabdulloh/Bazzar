import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage, Types } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ChatMessageType, ChatRequesterType, ChatScope, ChatStatus } from '../../libs/enums/chat.enum';
import {
	ChatsInquiry,
	ChatsInquiryByAdmin,
	GetChatInput,
	OpenBrandChatInput,
	OpenSupportChatInput,
} from '../../libs/dto/chat/chat.input';
import { Chat, Chats } from '../../libs/dto/chat/chat';
import { ChatUpdate } from '../../libs/dto/chat/chat.update';
import { MessageChat } from '../../libs/dto/messages-chat/messages-chat';
import { T } from '../../libs/types/common';
import { SocketGateway } from '../../socket/socket.gateway';
import { Member } from '../../libs/dto/member/member';

type ChatSide = 'requester' | 'responder';

@Injectable()
export class ChatService {
	constructor(
		@InjectModel('Chat') private readonly chatModel: Model<Chat>,
		@InjectModel('MessageChat') private readonly messageChatModel: Model<MessageChat>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly socketGateway: SocketGateway,
	) {}

	public async openOrGetBrandChat(memberId: ObjectId, input: OpenBrandChatInput): Promise<Chat> {
		if (memberId.toString() === input.brandId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existing = await this.chatModel
			.findOne({
				chatScope: ChatScope.BRAND_DIRECT,
				requesterId: memberId,
				requesterType: ChatRequesterType.USER,
				brandId: input.brandId,
			})
			.lean()
			.exec();

		if (existing) {
			await this.chatModel
				.updateOne(
					{ _id: existing._id },
					{
						$set: {
							chatStatus: ChatStatus.OPEN,
							...(input.chatSubject ? { chatSubject: input.chatSubject } : {}),
						},
						$pull: { deletedForMemberIds: new Types.ObjectId(memberId.toString()) },
					},
				)
				.exec();

			await this.emitChatListUpdated(existing._id as ObjectId);
			return await this.getChat({ chatId: existing._id as ObjectId }, memberId, MemberType.USER);
		}

		const created = await this.chatModel.create({
			chatScope: ChatScope.BRAND_DIRECT,
			chatStatus: ChatStatus.OPEN,
			requesterId: memberId,
			requesterType: ChatRequesterType.USER,
			brandId: input.brandId,
			chatSubject: input.chatSubject ?? null,
		});

		await this.emitChatListUpdated(created._id as ObjectId);
		return await this.getChat({ chatId: created._id as ObjectId }, memberId, MemberType.USER);
	}

	public async openOrGetSupportChat(
		requesterId: ObjectId,
		requesterMemberType: MemberType,
		input: OpenSupportChatInput,
	): Promise<Chat> {
		if (requesterMemberType !== MemberType.USER && requesterMemberType !== MemberType.BRAND) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const requesterType =
			requesterMemberType === MemberType.BRAND ? ChatRequesterType.BRAND : ChatRequesterType.USER;

		const existing = await this.chatModel
			.findOne({
				chatScope: ChatScope.ADMIN_SUPPORT,
				requesterId,
				requesterType,
				chatStatus: { $ne: ChatStatus.CLOSED },
			})
			.sort({ updatedAt: Direction.DESC })
			.lean()
			.exec();

		if (existing) {
			await this.chatModel
				.updateOne(
					{ _id: existing._id },
					{
						$set: {
							...(existing.supportTopic ? {} : { supportTopic: input.supportTopic ?? null }),
							...(existing.sourcePath ? {} : { sourcePath: input.sourcePath ?? null }),
						},
						$pull: { deletedForMemberIds: new Types.ObjectId(requesterId.toString()) },
					},
				)
				.exec();

			await this.emitChatListUpdated(existing._id as ObjectId);
			return await this.getChat({ chatId: existing._id as ObjectId }, requesterId, requesterMemberType);
		}

		const created = await this.chatModel.create({
			chatScope: ChatScope.ADMIN_SUPPORT,
			chatStatus: ChatStatus.PENDING,
			requesterId,
			requesterType,
			brandId: requesterMemberType === MemberType.BRAND ? requesterId : null,
			assignedAdminId: null,
			supportTopic: input.supportTopic ?? null,
			sourcePath: input.sourcePath ?? null,
		});

		await this.emitChatListUpdated(created._id as ObjectId);
		return await this.getChat({ chatId: created._id as ObjectId }, requesterId, requesterMemberType);
	}

	public async getChat(input: GetChatInput, viewerId: ObjectId, viewerType: MemberType): Promise<Chat> {
		const rawChat = await this.chatModel.findById(input.chatId).lean().exec();
		if (!rawChat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.getChatAccessContext(rawChat, viewerId, viewerType);

		const result = await this.chatModel
			.aggregate([
				{ $match: { _id: input.chatId } },
				...this.buildChatLookupStages(),
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return this.enrichChatForViewer(result[0], viewerId, viewerType);
	}

	public async getMyChats(memberId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const match = this.buildBaseChatMatch(input.search);
		match.requesterId = memberId;
		match.requesterType = ChatRequesterType.USER;
		match.deletedForMemberIds = { $nin: [memberId] };
		return await this.buildChatsAggregate(match, input, memberId, MemberType.USER);
	}

	public async getBrandChats(brandId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const match = this.buildBaseChatMatch(input.search);
		match.chatScope = ChatScope.BRAND_DIRECT;
		match.brandId = brandId;
		match.deletedForMemberIds = { $nin: [brandId] };
		return await this.buildChatsAggregate(match, input, brandId, MemberType.BRAND);
	}

	public async getMySupportChats(memberId: ObjectId, memberType: MemberType, input: ChatsInquiry): Promise<Chats> {
		if (memberType !== MemberType.USER && memberType !== MemberType.BRAND) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const requesterType = memberType === MemberType.BRAND ? ChatRequesterType.BRAND : ChatRequesterType.USER;
		const match = this.buildBaseChatMatch(input.search);
		match.chatScope = ChatScope.ADMIN_SUPPORT;
		match.requesterId = memberId;
		match.requesterType = requesterType;
		match.deletedForMemberIds = { $nin: [memberId] };
		return await this.buildChatsAggregate(match, input, memberId, memberType);
	}

	public async getAdminSupportChats(adminId: ObjectId, input: ChatsInquiryByAdmin): Promise<Chats> {
		const match = this.buildBaseChatMatch(input.search);
		match.chatScope = ChatScope.ADMIN_SUPPORT;
		match.deletedForMemberIds = { $nin: [adminId] };
		return await this.buildChatsAggregate(match, input, adminId, MemberType.ADMIN);
	}

	public async getAllChatsByAdmin(adminId: ObjectId, input: ChatsInquiryByAdmin): Promise<Chats> {
		return await this.getAdminSupportChats(adminId, input);
	}

	public async deleteChat(callerId: ObjectId, callerType: MemberType, chatId: ObjectId): Promise<Chat> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.getChatAccessContext(chat, callerId, callerType);

		await this.chatModel
			.updateOne({ _id: chatId }, { $addToSet: { deletedForMemberIds: new Types.ObjectId(callerId.toString()) } })
			.exec();

		await this.emitChatListUpdated(chatId);
		return await this.getChat({ chatId }, callerId, callerType);
	}

	public async claimSupportChat(adminId: ObjectId, chatId: ObjectId): Promise<Chat> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);
		if (chat.chatScope !== ChatScope.ADMIN_SUPPORT) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (chat.chatStatus === ChatStatus.CLOSED) throw new BadRequestException(Message.BAD_REQUEST);

		if (chat.assignedAdminId && chat.assignedAdminId.toString() !== adminId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		await this.chatModel
			.updateOne(
				{ _id: chatId },
				{
					$set: { assignedAdminId: adminId, chatStatus: ChatStatus.OPEN },
					$pull: { deletedForMemberIds: new Types.ObjectId(adminId.toString()) },
				},
			)
			.exec();

		const updated = await this.chatModel.findById(chatId).lean().exec();
		if (updated) {
			const audienceIds = await this.getRealtimeAudienceIds(updated);
			this.socketGateway.emitChatClaimed(chatId.toString(), audienceIds, {
				chatId: chatId.toString(),
				assignedAdminId: adminId.toString(),
			});
			this.socketGateway.emitChatListUpdated(audienceIds, { chatId: chatId.toString() });
		}

		return await this.getChat({ chatId }, adminId, MemberType.ADMIN);
	}

	public async closeChat(callerId: ObjectId, callerType: MemberType, chatId: ObjectId): Promise<Chat> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		this.getChatAccessContext(chat, callerId, callerType, true);

		await this.chatModel.updateOne({ _id: chatId }, { $set: { chatStatus: ChatStatus.CLOSED } }).exec();

		const updated = await this.chatModel.findById(chatId).lean().exec();
		if (updated) {
			const audienceIds = await this.getRealtimeAudienceIds(updated);
			this.socketGateway.emitChatClosed(chatId.toString(), audienceIds, { chatId: chatId.toString() });
			this.socketGateway.emitChatListUpdated(audienceIds, { chatId: chatId.toString() });
		}

		return await this.getChat({ chatId }, callerId, callerType);
	}

	public async markChatMessagesAsRead(chatId: ObjectId, viewerId: ObjectId, viewerType: MemberType): Promise<Chat> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		const access = this.getChatAccessContext(chat, viewerId, viewerType);

		await this.messageChatModel
			.updateMany(
				{
					conversationId: chatId,
					senderId: { $ne: viewerId },
					deletedAt: { $exists: false },
					readByMemberIds: { $nin: [viewerId] },
				},
				{
					$addToSet: { readByMemberIds: new Types.ObjectId(viewerId.toString()) },
				},
			)
			.exec();

		await this.chatModel
			.updateOne(
				{ _id: chatId },
				{
					$set:
						access.side === 'requester'
							? { unreadRequesterCount: 0 }
							: { unreadResponderCount: 0 },
				},
			)
			.exec();

		const updated = await this.chatModel.findById(chatId).lean().exec();
		if (updated) {
			const audienceIds = await this.getRealtimeAudienceIds(updated);
			this.socketGateway.emitMessagesRead(chatId.toString(), audienceIds, {
				chatId: chatId.toString(),
				memberId: viewerId.toString(),
			});
			this.socketGateway.emitChatListUpdated(audienceIds, { chatId: chatId.toString() });
		}

		return await this.getChat({ chatId }, viewerId, viewerType);
	}

	public async getMyUnreadChatCount(memberId: ObjectId, memberType: MemberType): Promise<number> {
		if (memberType === MemberType.USER) {
			const result = await this.chatModel
				.aggregate([
					{
						$match: {
							requesterId: memberId,
							requesterType: ChatRequesterType.USER,
							chatStatus: { $ne: ChatStatus.CLOSED },
							deletedForMemberIds: { $nin: [memberId] },
						},
					},
					{ $group: { _id: null, total: { $sum: '$unreadRequesterCount' } } },
				])
				.exec();
			return result[0]?.total ?? 0;
		}

		if (memberType === MemberType.BRAND) {
			const [directUnread, supportUnread] = await Promise.all([
				this.chatModel
					.aggregate([
						{
							$match: {
								chatScope: ChatScope.BRAND_DIRECT,
								brandId: memberId,
								chatStatus: { $ne: ChatStatus.CLOSED },
								deletedForMemberIds: { $nin: [memberId] },
							},
						},
						{ $group: { _id: null, total: { $sum: '$unreadResponderCount' } } },
					])
					.exec(),
				this.chatModel
					.aggregate([
						{
							$match: {
								chatScope: ChatScope.ADMIN_SUPPORT,
								requesterId: memberId,
								requesterType: ChatRequesterType.BRAND,
								chatStatus: { $ne: ChatStatus.CLOSED },
								deletedForMemberIds: { $nin: [memberId] },
							},
						},
						{ $group: { _id: null, total: { $sum: '$unreadRequesterCount' } } },
					])
					.exec(),
			]);
			return (directUnread[0]?.total ?? 0) + (supportUnread[0]?.total ?? 0);
		}

		const result = await this.chatModel
			.aggregate([
				{
					$match: {
						chatScope: ChatScope.ADMIN_SUPPORT,
						chatStatus: { $ne: ChatStatus.CLOSED },
						deletedForMemberIds: { $nin: [memberId] },
					},
				},
				{ $group: { _id: null, total: { $sum: '$unreadResponderCount' } } },
			])
			.exec();
		return result[0]?.total ?? 0;
	}

	public async updateChatByAdmin(input: ChatUpdate, adminId: ObjectId): Promise<Chat> {
		const chat = await this.chatModel.findById(input._id).lean().exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);
		if (chat.chatScope !== ChatScope.ADMIN_SUPPORT) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		await this.chatModel
			.updateOne(
				{ _id: input._id },
				{
					$set: {
						...(input.chatStatus ? { chatStatus: input.chatStatus } : {}),
						...(input.assignedAdminId ? { assignedAdminId: input.assignedAdminId } : {}),
					},
				},
			)
			.exec();

		const updated = await this.chatModel.findById(input._id).lean().exec();
		if (updated) {
			const audienceIds = await this.getRealtimeAudienceIds(updated);
			this.socketGateway.emitChatListUpdated(audienceIds, { chatId: input._id.toString() });
		}

		return await this.getChat({ chatId: input._id }, adminId, MemberType.ADMIN);
	}

	public async getChatById(chatId: ObjectId): Promise<T | null> {
		return await this.chatModel.findById(chatId).lean().exec();
	}

	public getChatAccessContext(
		chat: T,
		viewerId: ObjectId,
		viewerType: MemberType,
		requireWrite = false,
	): { side: ChatSide; isRequester: boolean; isResponder: boolean } {
		const viewerIdStr = viewerId.toString();
		const requesterIdStr = chat.requesterId?.toString();
		const brandIdStr = chat.brandId?.toString();
		const assignedAdminIdStr = chat.assignedAdminId?.toString();

		const isRequester = requesterIdStr === viewerIdStr;
		const isBrandResponder =
			chat.chatScope === ChatScope.BRAND_DIRECT && viewerType === MemberType.BRAND && brandIdStr === viewerIdStr;
		const isAdminResponder = chat.chatScope === ChatScope.ADMIN_SUPPORT && viewerType === MemberType.ADMIN;

		if (!isRequester && !isBrandResponder && !isAdminResponder) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (requireWrite) {
			if (chat.chatStatus === ChatStatus.CLOSED) {
				throw new BadRequestException('Chat is closed.');
			}

			if (chat.chatScope === ChatScope.ADMIN_SUPPORT && isAdminResponder && assignedAdminIdStr !== viewerIdStr) {
				throw new BadRequestException('Claim support chat first.');
			}
		}

		return { side: isRequester ? 'requester' : 'responder', isRequester, isResponder: !isRequester };
	}

	public async registerSentMessage(chatId: ObjectId, senderId: ObjectId, senderSide: ChatSide, message: T): Promise<void> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) return;

		const audienceIds = await this.getRealtimeAudienceIds(chat);
		const audienceObjectIds = audienceIds.map((id) => new Types.ObjectId(id));

		await this.chatModel
			.updateOne(
				{ _id: chatId },
				{
					$set: {
						lastMessageId: message._id,
						lastMessageAt: message.createdAt,
						lastMessageText: this.buildMessagePreview(message.messageType, message.message, message.attachments),
						lastMessageSenderId: senderId,
						unreadRequesterCount:
							senderSide === 'responder' ? Number(chat.unreadRequesterCount ?? 0) + 1 : Number(chat.unreadRequesterCount ?? 0),
						unreadResponderCount:
							senderSide === 'requester'
								? Number(chat.unreadResponderCount ?? 0) + 1
								: Number(chat.unreadResponderCount ?? 0),
					},
					$pull: { deletedForMemberIds: { $in: audienceObjectIds } },
				},
			)
			.exec();

		this.socketGateway.emitNewMessage(chatId.toString(), audienceIds, message, senderId.toString());
		this.socketGateway.emitChatListUpdated(audienceIds, { chatId: chatId.toString() });
	}

	public async refreshLastMessageSummary(chatId: ObjectId): Promise<void> {
		const latest = await this.messageChatModel
			.findOne({ conversationId: chatId, deletedAt: { $exists: false } })
			.sort({ createdAt: Direction.DESC })
			.lean()
			.exec();

		if (!latest) {
			await this.chatModel
				.updateOne(
					{ _id: chatId },
					{
						$set: {
							lastMessageId: null,
							lastMessageAt: null,
							lastMessageText: null,
							lastMessageSenderId: null,
						},
					},
				)
				.exec();
			return;
		}

		await this.chatModel
			.updateOne(
				{ _id: chatId },
				{
					$set: {
						lastMessageId: latest._id,
						lastMessageAt: latest.createdAt,
						lastMessageText: this.buildMessagePreview(latest.messageType, latest.message, latest.attachments),
						lastMessageSenderId: latest.senderId,
					},
				},
			)
			.exec();
	}

	private buildBaseChatMatch(search?: T): T {
		const match: T = {};
		if (!search) return match;

		if (search.chatStatus) match.chatStatus = search.chatStatus;
		if (search.chatScope) match.chatScope = search.chatScope;
		if (search.requesterType) match.requesterType = search.requesterType;
		if (search.requesterId) match.requesterId = search.requesterId;
		if (search.brandId) match.brandId = search.brandId;
		if (search.assignedAdminId) match.assignedAdminId = search.assignedAdminId;

		if (search.keyword) {
			match.$or = [
				{ chatSubject: { $regex: search.keyword, $options: 'i' } },
				{ supportTopic: { $regex: search.keyword, $options: 'i' } },
				{ lastMessageText: { $regex: search.keyword, $options: 'i' } },
			];
		}

		return match;
	}

	private async buildChatsAggregate(
		match: T,
		input: { page: number; limit: number; direction?: Direction },
		viewerId: ObjectId,
		viewerType: MemberType,
	): Promise<Chats> {
		const sortDirection = input?.direction ?? Direction.DESC;

		const result = await this.chatModel
			.aggregate([
				{ $match: match },
				{ $sort: { lastMessageAt: sortDirection, updatedAt: sortDirection, createdAt: sortDirection } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...(this.buildChatLookupStages() as any[]),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const payload = result[0] ?? { list: [], metaCounter: [] };
		return {
			list: payload.list.map((chat: T) => this.enrichChatForViewer(chat, viewerId, viewerType)),
			metaCounter: payload.metaCounter.length ? payload.metaCounter : [{ total: 0 }],
		};
	}

	private buildChatLookupStages(): PipelineStage[] {
		return [
			{
				$lookup: {
					from: 'members',
					localField: 'requesterId',
					foreignField: '_id',
					as: 'requesterData',
				},
			},
			{ $unwind: { path: '$requesterData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'brands',
					localField: 'brandId',
					foreignField: '_id',
					as: 'brandData',
				},
			},
			{ $unwind: { path: '$brandData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'members',
					localField: 'assignedAdminId',
					foreignField: '_id',
					as: 'assignedAdminData',
				},
			},
			{ $unwind: { path: '$assignedAdminData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'messages',
					localField: 'lastMessageId',
					foreignField: '_id',
					as: 'lastMessage',
				},
			},
			{ $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
		];
	}

	private enrichChatForViewer(chat: T, viewerId: ObjectId, viewerType: MemberType): Chat {
		const access = this.getChatAccessContext(chat, viewerId, viewerType);
		const viewerIdStr = viewerId.toString();
		const isAssignedAdmin = chat.assignedAdminId?.toString() === viewerIdStr;

		return {
			...chat,
			unreadRequesterCount: Number(chat.unreadRequesterCount ?? 0),
			unreadResponderCount: Number(chat.unreadResponderCount ?? 0),
			unreadCount:
				access.side === 'requester'
					? Number(chat.unreadRequesterCount ?? 0)
					: Number(chat.unreadResponderCount ?? 0),
			canReply:
				chat.chatStatus !== ChatStatus.CLOSED &&
				(chat.chatScope === ChatScope.BRAND_DIRECT ? true : access.isRequester || isAssignedAdmin),
		} as Chat;
	}

	private async emitChatListUpdated(chatId: ObjectId): Promise<void> {
		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat) return;
		const audienceIds = await this.getRealtimeAudienceIds(chat);
		this.socketGateway.emitChatListUpdated(audienceIds, { chatId: chatId.toString() });
	}

	private async getRealtimeAudienceIds(chat: T): Promise<string[]> {
		const ids = new Set<string>();

		if (chat.requesterId) ids.add(chat.requesterId.toString());
		if (chat.chatScope === ChatScope.BRAND_DIRECT && chat.brandId) ids.add(chat.brandId.toString());
		if (chat.chatScope === ChatScope.ADMIN_SUPPORT) {
			(await this.getSupportAdminIds()).forEach((id) => ids.add(id));
		}

		return [...ids];
	}

	private async getSupportAdminIds(): Promise<string[]> {
		const admins = await this.memberModel
			.find({ memberType: MemberType.ADMIN, memberStatus: MemberStatus.ACTIVE }, { _id: 1 })
			.lean()
			.exec();
		return admins.map((admin: T) => admin._id.toString());
	}

	private buildMessagePreview(messageType: ChatMessageType, message?: string, attachments?: string[]): string {
		const normalizedMessage = message?.trim();
		if (normalizedMessage) return normalizedMessage;
		if (messageType === ChatMessageType.IMAGE) return '[Image]';
		if (messageType === ChatMessageType.FILE) return '[File]';
		if (attachments?.length) return '[Attachment]';
		return '[Message]';
	}
}
