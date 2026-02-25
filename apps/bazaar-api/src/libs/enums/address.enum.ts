import { registerEnumType } from '@nestjs/graphql';

export enum AddressStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
}

registerEnumType(AddressStatus, { name: 'AddressStatus' });
