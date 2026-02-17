import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@InputType()
export class NotificationInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	authorId?: string;

	@IsMongoId()
	@Field(() => String)
	receiverId: string;

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

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	notificationTitle: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	notificationContent: string;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	readAt?: Date;
}
