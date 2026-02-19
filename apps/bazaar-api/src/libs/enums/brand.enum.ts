import { registerEnumType } from '@nestjs/graphql';

export enum BrandStatus {
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	SUSPENDED = 'SUSPENDED',
}

registerEnumType(BrandStatus, { name: 'BrandStatus' });
