import { Schema } from 'mongoose';
import { LikeGroup } from '../libs/enums/likes.enum';

const LikeSchema = new Schema(
	{
		likeGroup: {
			type: String,
			enum: LikeGroup,
			required: true,
		},

		likeRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
	},
	{ timestamps: true, collection: 'likes' },
);

// prevent duplicate likes per target per group
LikeSchema.index({ memberId: 1, likeGroup: 1, likeRefId: 1 }, { unique: true });

export default LikeSchema;
