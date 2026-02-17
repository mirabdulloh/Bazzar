import { Schema } from 'mongoose';
import { CategoryStatus } from '../libs/enums/cattegory.enum';

const CategorySchema = new Schema(
	{
		categoryName: {
			type: String,
			required: true,
		},

		parentCategoryId: {
			type: Schema.Types.ObjectId,
		},

		categoryStatus: {
			type: String,
			enum: CategoryStatus,
			default: CategoryStatus.ACTIVE,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'categories' },
);

CategorySchema.index({ parentCategoryId: 1, categoryName: 1 }, { unique: true });

export default CategorySchema;
