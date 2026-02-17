import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	GENERAL = 'GENERAL',
	PROMOTION = 'PROMOTION',
	SYSTEM = 'SYSTEM',
	UPDATE = 'UPDATE',
	OTHER = 'OTHER',
}

registerEnumType(NoticeCategory, { name: 'NoticeCategory' });

export enum NoticeStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETED = 'DELETED',
}

registerEnumType(NoticeStatus, { name: 'NoticeStatus' });
