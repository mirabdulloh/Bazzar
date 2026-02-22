import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

// Internal use — created by service, not exposed to client directly
@InputType()
export class NotificationInput {
	@IsMongoId()
	@Field(() => String)
	authorId: ObjectId;

	@IsMongoId()
	@Field(() => String)
	receiverId: ObjectId;

	@IsEnum(NotificationType)
	@Field(() => NotificationType)
	notificationType: NotificationType;

	@IsEnum(NotificationGroup)
	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	targetId?: ObjectId;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	notificationTitle: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	notificationContent: string;
}

@InputType()
class NotificationsSearch {
	@IsOptional()
	@IsEnum(NotificationStatus)
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;

	@IsOptional()
	@IsEnum(NotificationType)
	@Field(() => NotificationType, { nullable: true })
	notificationType?: NotificationType;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => NotificationsSearch, { nullable: true })
	search?: NotificationsSearch;
}
