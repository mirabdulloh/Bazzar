import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ChatStatus } from '../../libs/enums/chat.enum';
import { OpenChatInput, ChatsInquiry, ChatsInquiryByAdmin } from '../../libs/dto/chat/chat.input';
import { Chat, Chats } from '../../libs/dto/chat/chat';
import { ChatUpdate } from '../../libs/dto/chat/chat.update';
import { T } from '../../libs/types/common';

@Injectable()
export class ChatService {
	constructor(@InjectModel('Chat') private readonly chatModel: Model<Chat>) {}

	/** USER — open a conversation with a brand (returns existing if already open, re-opens if soft-deleted) */
	public async openOrGetChat(memberId: ObjectId, input: OpenChatInput): Promise<Chat> {
		const { brandId, chatSubject } = input;
		if (memberId.toString() === brandId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existing = await this.chatModel.findOne({ memberId, brandId }).exec();
		if (existing) {
			// If member had soft-deleted this chat, restore their view
			if (existing.memberDeletedAt) {
				await this.chatModel.updateOne({ _id: existing._id }, { $unset: { memberDeletedAt: '' } }).exec();
				existing.memberDeletedAt = undefined;
			}
			return existing;
		}

		// Create new chat
		const result = await this.chatModel.create({ memberId, brandId, chatSubject, chatStatus: ChatStatus.OPEN });
		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	/** USER — get all chats where I am the member (excludes soft-deleted by member) */
	public async getMyChats(memberId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const { chatStatus } = input.search ?? {};
		const match: T = { memberId, memberDeletedAt: { $exists: false } };
		if (chatStatus) match.chatStatus = chatStatus;
		return this.buildChatsAggregate(match, input);
	}

	/** BRAND — get all chats where I am the brand (excludes soft-deleted by brand) */
	public async getBrandChats(brandId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const { chatStatus } = input.search ?? {};
		const match: T = { brandId, brandDeletedAt: { $exists: false } };
		if (chatStatus) match.chatStatus = chatStatus;
		return this.buildChatsAggregate(match, input);
	}

	/** USER or BRAND — soft-delete their side of the chat */
	public async deleteChat(callerId: ObjectId, chatId: ObjectId): Promise<Chat> {
		const chat = await this.chatModel.findById(chatId).exec();
		if (!chat) throw new NotFoundException(Message.NO_DATA_FOUND);

		const callerIdStr = callerId.toString();
		const update: T = {};

		if (chat.memberId.toString() === callerIdStr) {
			if (chat.memberDeletedAt) throw new BadRequestException(Message.BAD_REQUEST);
			update.memberDeletedAt = new Date();
		} else if (chat.brandId.toString() === callerIdStr) {
			if (chat.brandDeletedAt) throw new BadRequestException(Message.BAD_REQUEST);
			update.brandDeletedAt = new Date();
		} else {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const result = await this.chatModel.findByIdAndUpdate(chatId, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	/** ADMIN — paginated list of all chats (all statuses, soft-deletes visible) */
	public async getAllChatsByAdmin(input: ChatsInquiryByAdmin): Promise<Chats> {
		const { chatStatus, brandId, memberId } = input.search ?? {};
		const match: T = {};
		if (chatStatus) match.chatStatus = chatStatus;
		if (brandId) match.brandId = brandId;
		if (memberId) match.memberId = memberId;
		return this.buildChatsAggregate(match, input);
	}

	/** ADMIN — update chat status */
	public async updateChatByAdmin(input: ChatUpdate): Promise<Chat> {
		const { _id } = input;
		const result = await this.chatModel.findByIdAndUpdate(_id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	/** Internal lookup used by MessageChatService to verify chat membership */
	public async getChatById(chatId: ObjectId): Promise<Chat | null> {
		return this.chatModel.findById(chatId).lean().exec();
	}

	private async buildChatsAggregate(
		match: T,
		input: { page: number; limit: number; direction?: Direction },
	): Promise<Chats> {
		const sort: T = { createdAt: input?.direction ?? Direction.DESC };

		const result = await this.chatModel
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
									localField: 'memberId',
									foreignField: '_id',
									as: 'memberData',
								},
							},
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'brands',
									localField: 'brandId',
									foreignField: '_id',
									as: 'brandData',
								},
							},
							{ $unwind: { path: '$brandData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}
}
