import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	ADMIN = 'ADMIN',
	BRAND = 'BRAND',
}

registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, { name: 'MemberAuthType' });

export enum MemberCouponStatus {
	UNUSED = 'UNUSED',
	USED = 'USED',
	EXPIRED = 'EXPIRED',
}

registerEnumType(MemberCouponStatus, { name: 'MemberCouponStatus' });
