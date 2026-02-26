import { Schema } from 'mongoose';
import { FaqCategory, FaqStatus } from '../libs/enums/faqs.enum';

const FaqSchema = new Schema(
	{
		faqQuestion: {
			type: String,
			required: true,
		},

		faqAnswer: {
			type: String,
			required: true,
		},

		faqCategory: {
			type: String,
			enum: FaqCategory,
			default: FaqCategory.GENERAL,
		},

		faqStatus: {
			type: String,
			enum: FaqStatus,
			default: FaqStatus.ACTIVE,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'faqs' },
);

export default FaqSchema;
