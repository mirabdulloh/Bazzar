import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@InputType()
export class NotificationUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	authorId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	receiverId?: string;

	@IsOptional()
	@IsEnum(NotificationType)
	@Field(() => NotificationType, { nullable: true })
	notificationType?: NotificationType;

	@IsOptional()
	@IsEnum(NotificationStatus)
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;

	@IsOptional()
	@IsEnum(NotificationGroup)
	@Field(() => NotificationGroup, { nullable: true })
	notificationGroup?: NotificationGroup;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	targetId?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	notificationTitle?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	notificationContent?: string;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	readAt?: Date;
}
