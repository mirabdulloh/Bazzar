import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		message: {
			type: String,
			required: true,
		},

		attachments: {
			type: [String],
			default: [],
		},

		replyToId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		readAt: {
			type: Date,
		},

		memberDeletedAt: {
			type: Date,
		},

		brandDeletedAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default MessageSchema;
