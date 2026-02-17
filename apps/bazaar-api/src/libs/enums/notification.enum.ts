import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	ORDER = 'ORDER',
	REVIEW = 'REVIEW',
	FOLLOW = 'FOLLOW',
	SYSTEM = 'SYSTEM',
	OTHER = 'OTHER',
}
registerEnumType(NotificationType, { name: 'NotificationType' });

export enum NotificationStatus {
	UNREAD = 'UNREAD',
	READ = 'READ',
	ARCHIVED = 'ARCHIVED',
}
registerEnumType(NotificationStatus, { name: 'NotificationStatus' });

export enum NotificationGroup {
	PRODUCT = 'PRODUCT',
	ORDER = 'ORDER',
	REVIEW = 'REVIEW',
	MEMBER = 'MEMBER',
	SYSTEM = 'SYSTEM',
	ARTICLE = 'ARTICLE',
	OTHER = 'OTHER',
}
registerEnumType(NotificationGroup, { name: 'NotificationGroup' });
