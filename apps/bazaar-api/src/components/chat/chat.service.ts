import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ChatStatus } from '../../libs/enums/chat.enum';
import { OpenChatInput, ChatsInquiry } from '../../libs/dto/chat/chat.input';
import { Chat, Chats } from '../../libs/dto/chat/chat';
import { ChatUpdate } from '../../libs/dto/chat/chat.update';
import { T } from '../../libs/types/common';

@Injectable()
export class ChatService {
	constructor(@InjectModel('Chat') private readonly chatModel: Model<Chat>) {}

	/** USER — open a conversation with a brand (returns existing if already open) */
	public async openOrGetChat(memberId: ObjectId, input: OpenChatInput): Promise<Chat> {
		const { brandId, chatSubject } = input;
		if (memberId.toString() === brandId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		// Upsert: create if not exists, return existing if found
		const result = await this.chatModel
			.findOneAndUpdate(
				{ memberId, brandId },
				{ $setOnInsert: { memberId, brandId, chatSubject, chatStatus: ChatStatus.OPEN } },
				{ upsert: true, new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	/** USER — get all chats where I am the member (customer side) */
	public async getMyChats(memberId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const match: T = { memberId };
		return this.buildChatsAggregate(match, input);
	}

	/** BRAND — get all chats where I am the brand */
	public async getBrandChats(brandId: ObjectId, input: ChatsInquiry): Promise<Chats> {
		const { chatStatus } = input.search ?? {};
		const match: T = { brandId };
		if (chatStatus) match.chatStatus = chatStatus;
		return this.buildChatsAggregate(match, input);
	}

	/** ADMIN — paginated list of all chats */
	public async getAllChatsByAdmin(input: ChatsInquiry): Promise<Chats> {
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

	private async buildChatsAggregate(match: T, input: ChatsInquiry): Promise<Chats> {
		const sort: T = { ['createdAt']: input?.direction ?? Direction.DESC };

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

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}
}
