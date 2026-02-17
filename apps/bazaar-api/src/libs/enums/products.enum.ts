import { registerEnumType } from '@nestjs/graphql';

export enum ProductType {
	CLOTHING = 'CLOTHING',
	SHOES = 'SHOES',
	ACCECORY = 'ACCECORY',
	BAG = 'BAG',
	BEAUTY = 'BEAUTY',
	LIFESTYLE = 'LIFESTYLE',
	SPORTS = 'SPORTS',
	OTHER = 'OTHER',
}

registerEnumType(ProductType, { name: 'ProductType' });

export enum ProductStatus {
	DRAFT = 'DRAFT',
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	SOLD_OUT = 'SOLD_OUT',
	HIDDEN = 'HIDDEN',
	REJECTED = 'REJECTED',
	DELETED = 'DELETED',
}

registerEnumType(ProductStatus, { name: 'ProductStatus' });
