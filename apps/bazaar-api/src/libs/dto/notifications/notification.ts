import { Field, ObjectType } from '@nestjs/graphql';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { Member } from '../member/member';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => String, { nullable: true })
	authorId?: string;

	@Field(() => String)
	receiverId: string;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@Field(() => String, { nullable: true })
	targetId?: string;

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

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;

	@Field(() => Member, { nullable: true })
	author?: Member;

	@Field(() => Member, { nullable: true })
	receiver?: Member;
}
