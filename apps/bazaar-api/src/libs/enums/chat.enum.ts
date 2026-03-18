import { registerEnumType } from '@nestjs/graphql';

export enum ChatStatus {
	PENDING = 'PENDING',
	OPEN = 'OPEN',
	CLOSED = 'CLOSED',
}

registerEnumType(ChatStatus, { name: 'ChatStatus' });

export enum ChatScope {
	BRAND_DIRECT = 'BRAND_DIRECT',
	ADMIN_SUPPORT = 'ADMIN_SUPPORT',
}

registerEnumType(ChatScope, { name: 'ChatScope' });

export enum ChatRequesterType {
	USER = 'USER',
	BRAND = 'BRAND',
}

registerEnumType(ChatRequesterType, { name: 'ChatRequesterType' });

export enum ChatMessageType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	FILE = 'FILE',
}

registerEnumType(ChatMessageType, { name: 'ChatMessageType' });
