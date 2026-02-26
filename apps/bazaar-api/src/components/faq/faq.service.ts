import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FaqStatus } from '../../libs/enums/faqs.enum';
import { FaqInput, FaqsInquiry, FaqsInquiryByAdmin } from '../../libs/dto/faqs/faq.input';
import { Faq, Faqs } from '../../libs/dto/faqs/faq';
import { FaqUpdate } from '../../libs/dto/faqs/faq.update';
import { T } from '../../libs/types/common';

@Injectable()
export class FaqService {
	private readonly logger = new Logger(FaqService.name);

	constructor(@InjectModel('Faq') private readonly faqModel: Model<Faq>) {}

	/** ADMIN */

	public async createFaqByAdmin(input: FaqInput): Promise<Faq> {
		try {
			return await this.faqModel.create(input);
		} catch (err) {
			this.logger.error('createFaqByAdmin failed:', err.message);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	public async updateFaqByAdmin(input: FaqUpdate): Promise<Faq> {
		const { _id, faqStatus } = input;

		if (faqStatus === FaqStatus.DELETED) input['deletedAt'] = new Date();

		const result = await this.faqModel
			.findOneAndUpdate({ _id, faqStatus: { $ne: FaqStatus.DELETED } }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeFaqByAdmin(faqId: ObjectId): Promise<Faq> {
		const result = await this.faqModel
			.findOneAndDelete({ _id: faqId, faqStatus: FaqStatus.DELETED })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async getAllFaqsByAdmin(input: FaqsInquiryByAdmin): Promise<Faqs> {
		const { faqCategory, faqStatus, text } = input.search ?? {};
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (faqCategory) match.faqCategory = faqCategory;
		if (faqStatus) match.faqStatus = faqStatus;
		if (text) match.faqQuestion = { $regex: text, $options: 'i' };

		const result = await this.faqModel
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

	public async getFaqs(input: FaqsInquiry): Promise<Faqs> {
		const { faqCategory, text } = input.search ?? {};
		const match: T = { faqStatus: FaqStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (faqCategory) match.faqCategory = faqCategory;
		if (text) match.faqQuestion = { $regex: text, $options: 'i' };

		const result = await this.faqModel
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
