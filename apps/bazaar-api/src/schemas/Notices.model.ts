import { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../libs/enums/notices.enum';

const NoticeSchema = new Schema(
	{
		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},

		noticeCategory: {
			type: String,
			enum: NoticeCategory,
			default: NoticeCategory.GENERAL,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'notices' },
);

export default NoticeSchema;
