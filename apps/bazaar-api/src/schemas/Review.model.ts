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

// DB-level uniqueness: one review per orderItem (prevents race-condition duplicates)
ReviewSchema.index({ orderItemId: 1 }, { unique: true });
// Query optimization: getReviews filters by productId + reviewStatus on every call
ReviewSchema.index({ productId: 1, reviewStatus: 1 });
ReviewSchema.index({ memberId: 1 });

export default ReviewSchema;
