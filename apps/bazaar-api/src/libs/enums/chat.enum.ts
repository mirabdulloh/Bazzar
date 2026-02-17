import { registerEnumType } from '@nestjs/graphql';

export enum ChatStatus {
	OPEN = 'OPEN',
	CLOSED = 'CLOSED',
	PENDING = 'PENDING',
}

registerEnumType(ChatStatus, { name: 'ChatStatus' });
