import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Notification, Notifications } from '../../libs/dto/notifications/notification';
import { NotificationsInquiry } from '../../libs/dto/notifications/notification.input';
import { NotificationUpdate } from '../../libs/dto/notifications/notification.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	/** USER */

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getMyNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getMyNotifications');
		return await this.notificationService.getMyNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async markNotificationAsRead(
		@Args('input') input: NotificationUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: markNotificationAsRead');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.notificationService.markNotificationAsRead(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async markAllNotificationsAsRead(@AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		console.log('Mutation: markAllNotificationsAsRead');
		return await this.notificationService.markAllNotificationsAsRead(memberId);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Notifications)
	public async getAllNotificationsByAdmin(@Args('input') input: NotificationsInquiry): Promise<Notifications> {
		console.log('Query: getAllNotificationsByAdmin');
		return await this.notificationService.getAllNotificationsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Notification)
	public async removeNotificationByAdmin(@Args('notificationId') input: string): Promise<Notification> {
		console.log('Mutation: removeNotificationByAdmin');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.removeNotificationByAdmin(notificationId);
	}
}
