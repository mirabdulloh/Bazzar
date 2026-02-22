import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { Member } from '../member/member';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String, { nullable: true })
	authorId?: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@Field(() => String, { nullable: true })
	targetId?: ObjectId;

	@Field(() => String)
	notificationTitle: string;

	@Field(() => String)
	notificationContent: string;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// Relationship
	@Field(() => Member, { nullable: true })
	authorData?: Member;
}

@ObjectType()
export class TotalCounter {
	@Field(() => Int)
	total: number;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list: Notification[];

	@Field(() => [TotalCounter])
	metaCounter: TotalCounter[];
}
