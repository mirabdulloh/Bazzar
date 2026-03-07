import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NotificationStatus } from '../../libs/enums/notification.enum';
import { NotificationInput, NotificationsInquiry } from '../../libs/dto/notifications/notification.input';
import { Notification, Notifications } from '../../libs/dto/notifications/notification';
import { NotificationUpdate } from '../../libs/dto/notifications/notification.update';
import { availableNotificationSorts } from '../../libs/config';
import { SocketGateway } from '../../socket/socket.gateway';
import { T } from '../../libs/types/common';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);

	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		private readonly socketGateway: SocketGateway,
	) {}

	/** INTERNAL — called by other services to push a notification */
	public async createNotification(input: NotificationInput): Promise<Notification> {
		try {
			// memberId mirrors receiverId (the person who receives it)
			const result = await this.notificationModel.create({ ...input, memberId: input.receiverId });
			// Real-time push to the receiver if they are online
			this.socketGateway.emitToUser(input.receiverId.toString(), 'notification', result);
			return result;
		} catch (err) {
			this.logger.error('createNotification failed:', err.message);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	/** USER — get my notifications (paginated, filterable) */
	public async getMyNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const { notificationStatus, notificationType } = input.search ?? {};
		const match: T = { receiverId: memberId };
		const sortKey = availableNotificationSorts.includes(input?.sort ?? '') ? input.sort! : 'createdAt';
		const sort: T = { [sortKey]: input?.direction ?? Direction.DESC };

		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationType) match.notificationType = notificationType;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$addFields: {
						memberId: { $ifNull: ['$memberId', '$receiverId'] },
						notificationContent: { $ifNull: ['$notificationContent', ''] },
					},
				},
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'members',
									localField: 'authorId',
									foreignField: '_id',
									as: 'authorData',
								},
							},
							{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** USER — mark a single notification as read */
	public async markNotificationAsRead(memberId: ObjectId, input: NotificationUpdate): Promise<Notification> {
		const { _id } = input;
		const result = await this.notificationModel
			.findOneAndUpdate(
				{ _id, receiverId: memberId },
				{ notificationStatus: NotificationStatus.READ, readAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	/** USER — mark all unread notifications as read */
	public async markAllNotificationsAsRead(memberId: ObjectId): Promise<boolean> {
		const now = new Date();
		await this.notificationModel
			.updateMany(
				{ receiverId: memberId, notificationStatus: NotificationStatus.UNREAD },
				{ notificationStatus: NotificationStatus.READ, readAt: now },
			)
			.exec();
		return true;
	}

	/** ADMIN — paginated list of all notifications */
	public async getAllNotificationsByAdmin(input: NotificationsInquiry): Promise<Notifications> {
		const { notificationStatus, notificationType } = input.search ?? {};
		const match: T = {};
		const sortKey = availableNotificationSorts.includes(input?.sort ?? '') ? input.sort! : 'createdAt';
		const sort: T = { [sortKey]: input?.direction ?? Direction.DESC };

		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationType) match.notificationType = notificationType;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$addFields: {
						memberId: { $ifNull: ['$memberId', '$receiverId'] },
						notificationContent: { $ifNull: ['$notificationContent', ''] },
					},
				},
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** USER — delete all own notifications */
	public async removeAllMyNotifications(memberId: ObjectId): Promise<boolean> {
		await this.notificationModel.deleteMany({ receiverId: memberId }).exec();
		return true;
	}

	/** ADMIN — hard delete a notification */
	public async removeNotificationByAdmin(notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel.findByIdAndDelete(notificationId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
