import { Schema } from 'mongoose';
import { ChatStatus } from '../libs/enums/chat.enum';

const ChatSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		brandId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		chatStatus: {
			type: String,
			enum: ChatStatus,
			default: ChatStatus.OPEN,
		},

		chatSubject: {
			type: String,
			required: true,
		},

		memberDeletedAt: {
			type: Date,
			default: null,
		},

		brandDeletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true, collection: 'chats' },
);

ChatSchema.index({ memberId: 1, brandId: 1 }, { unique: true });

export default ChatSchema;
