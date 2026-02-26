import { registerEnumType } from '@nestjs/graphql';

export enum FaqCategory {
	GENERAL = 'GENERAL',
	PRODUCTS = 'PRODUCTS',
	ORDERS = 'ORDERS',
	PAYMENTS = 'PAYMENTS',
	SHIPPING = 'SHIPPING',
	ACCOUNT = 'ACCOUNT',
	OTHER = 'OTHER',
}

registerEnumType(FaqCategory, { name: 'FaqCategory' });

export enum FaqStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETED = 'DELETED',
}

registerEnumType(FaqStatus, { name: 'FaqStatus' });
