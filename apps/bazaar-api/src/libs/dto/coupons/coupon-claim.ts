import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CouponClaimStatus } from '../../enums/coupons.enum';
import { Coupon } from './coupon';
import { MetaData } from '../member/member';

@ObjectType()
export class CouponClaim {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	couponId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String, { nullable: true })
	brandId?: ObjectId;

	@Field(() => String, { nullable: true })
	orderId?: ObjectId;

	@Field(() => CouponClaimStatus)
	claimStatus: CouponClaimStatus;

	@Field(() => Date)
	claimedAt: Date;

	@Field(() => Date, { nullable: true })
	usedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Coupon, { nullable: true })
	coupon?: Coupon;
}

@ObjectType()
export class CouponClaimsData {
	@Field(() => [CouponClaim])
	list: CouponClaim[];

	@Field(() => MetaData)
	metaData: MetaData;
}
