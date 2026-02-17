import { Schema } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		authorId: {
			type: Schema.Types.ObjectId,
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		notificationType: {
			type: String,
			enum: NotificationType,
			default: NotificationType.OTHER,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.UNREAD,
		},

		notificationGroup: {
			type: String,
			enum: NotificationGroup,
			default: NotificationGroup.OTHER,
		},

		targetId: {
			type: Schema.Types.ObjectId,
		},

		notificationTitle: {
			type: String,
			required: true,
		},

		notificationContent: {
			type: String,
			required: true,
		},

		deletedAt: {
			type: Date,
		},
		readAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

export default NotificationSchema;
