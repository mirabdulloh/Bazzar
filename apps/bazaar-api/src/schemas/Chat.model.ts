import { Schema } from 'mongoose';
import { ChatRequesterType, ChatScope, ChatStatus } from '../libs/enums/chat.enum';

const ChatSchema = new Schema(
	{
		chatScope: {
			type: String,
			enum: Object.values(ChatScope),
			required: true,
		},

		chatStatus: {
			type: String,
			enum: Object.values(ChatStatus),
			default: ChatStatus.PENDING,
		},

		requesterId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		requesterType: {
			type: String,
			enum: Object.values(ChatRequesterType),
			required: true,
		},

		brandId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		assignedAdminId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		chatSubject: {
			type: String,
			default: null,
		},

		supportTopic: {
			type: String,
			default: null,
		},

		sourcePath: {
			type: String,
			default: null,
		},

		lastMessageId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		lastMessageAt: {
			type: Date,
			default: null,
		},

		lastMessageText: {
			type: String,
			default: null,
		},

		lastMessageSenderId: {
			type: Schema.Types.ObjectId,
			default: null,
		},

		unreadRequesterCount: {
			type: Number,
			default: 0,
		},

		unreadResponderCount: {
			type: Number,
			default: 0,
		},

		deletedForMemberIds: {
			type: [Schema.Types.ObjectId],
			default: [],
		},
	},
	{ timestamps: true, collection: 'chats' },
);

ChatSchema.index({ chatScope: 1, requesterId: 1, chatStatus: 1, updatedAt: -1 });
ChatSchema.index({ chatScope: 1, brandId: 1, chatStatus: 1, updatedAt: -1 });
ChatSchema.index({ assignedAdminId: 1, chatStatus: 1, updatedAt: -1 });
ChatSchema.index({ lastMessageAt: -1 });

export default ChatSchema;
