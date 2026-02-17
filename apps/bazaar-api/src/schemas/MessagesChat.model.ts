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

		readAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

export default MessageSchema;
