import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comments.enum';

const CommentSchema = new Schema(
	{
		commentStatus: {
			type: String,
			enum: CommentStatus,
			default: CommentStatus.ACTIVE,
			required: true,
		},

		commentGroup: {
			type: String,
			enum: CommentGroup,
			default: CommentGroup.PRODUCT,
			required: true,
		},

		commentRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		commentReplyId: {
			type: Schema.Types.ObjectId,
		},

		commentContent: {
			type: String,
			required: true,
		},

		commentLikes: {
			type: Number,
			default: 0,
		},

		commentViews: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'comments' },
);

export default CommentSchema;
