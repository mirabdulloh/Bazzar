import { Schema } from 'mongoose';
import { ReviewStatus } from '../libs/enums/review.enum';

const ReviewSchema = new Schema(
	{
		productId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		orderItemId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		reviewRating: {
			type: Number,
			required: true,
		},

		reviewComment: {
			type: String,
			required: true,
		},

		reviewImages: {
			type: [String],
			default: [],
		},

		reviewStatus: {
			type: String,
			enum: ReviewStatus,
			default: ReviewStatus.ACTIVE,
		},

		reviewLikes: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'reviews' },
);

export default ReviewSchema;
