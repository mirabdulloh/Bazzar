import { registerEnumType } from '@nestjs/graphql';

export enum DiscountType {
	FIXED = 'FIXED',
	PERCENTAGE = 'PERCENTAGE',
}

registerEnumType(DiscountType, { name: 'DiscountType' });

export enum CouponStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	EXPIRED = 'EXPIRED',
}

registerEnumType(CouponStatus, { name: 'CouponStatus' });
