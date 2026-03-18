import { Schema } from 'mongoose';
import { ChatMessageType } from '../libs/enums/chat.enum';
import { MemberType } from '../libs/enums/member.enum';

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

		senderType: {
			type: String,
			enum: Object.values(MemberType),
			required: true,
		},

		messageType: {
			type: String,
			enum: Object.values(ChatMessageType),
			default: ChatMessageType.TEXT,
		},

		message: {
			type: String,
			default: null,
		},

		attachments: {
			type: [String],
			default: [],
		},

		replyToId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		readByMemberIds: {
			type: [Schema.Types.ObjectId],
			default: [],
		},

		deletedAt: {
			type: Date,
		},

		deletedForMemberIds: {
			type: [Schema.Types.ObjectId],
			default: [],
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default MessageSchema;
