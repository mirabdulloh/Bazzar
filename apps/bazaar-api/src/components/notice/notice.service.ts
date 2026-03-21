import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NoticeStatus } from '../../libs/enums/notices.enum';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/notices/notice.input';
import { Notice, Notices } from '../../libs/dto/notices/notice';
import { NoticeUpdate } from '../../libs/dto/notices/notice.update';
import { T } from '../../libs/types/common';

@Injectable()
export class NoticeService {
	private readonly logger = new Logger(NoticeService.name);

	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	/** ADMIN */

	public async createNoticeByAdmin(input: NoticeInput): Promise<Notice> {
		try {
			return await this.noticeModel.create(input);
		} catch (err) {
			this.logger.error('createNoticeByAdmin failed:', err.message);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const { _id, noticeStatus } = input;

		if (noticeStatus === NoticeStatus.DELETED) input['deletedAt'] = new Date();

		const result = await this.noticeModel
			.findOneAndUpdate({ _id, noticeStatus: { $ne: NoticeStatus.DELETED } }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndDelete({ _id: noticeId, noticeStatus: NoticeStatus.DELETED })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async getAllNoticesByAdmin(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeStatus } = input.search ?? {};
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
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

	/** USER */

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory } = input.search ?? {};
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (noticeCategory) match.noticeCategory = noticeCategory;

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
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
}
