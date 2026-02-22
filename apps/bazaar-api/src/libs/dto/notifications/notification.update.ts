import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { NotificationStatus } from '../../enums/notification.enum';

@InputType()
export class NotificationUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsEnum(NotificationStatus)
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;
}
