import { Schema } from 'mongoose';
import { BrandStatus } from '../libs/enums/brand.enum';

const BrandSchema = new Schema(
	{
		brandName: {
			type: String,
			required: true,
			unique: true,
		},

		brandLogo: {
			type: String,
		},

		brandDesc: {
			type: String,
		},

		brandStatus: {
			type: String,
			enum: BrandStatus,
			default: BrandStatus.PENDING,
		},

		brandRating: {
			type: Number,
			default: 0,
		},

		brandFollowersCount: {
			type: Number,
			default: 0,
		},

		brandReviewsCount: {
			type: Number,
			default: 0,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'brands' },
);

export default BrandSchema;
