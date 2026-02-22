import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CouponStatus, DiscountType } from '../../enums/coupons.enum';
import { MetaCounter } from '../member/member';

@ObjectType()
export class Coupon {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	couponCode: string;

	@Field(() => DiscountType)
	discountType: DiscountType;

	@Field(() => Float)
	discountValue: number;

	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@Field(() => Int)
	couponUsageCount: number;

	@Field(() => Date)
	couponStartDate: Date;

	@Field(() => Date)
	couponEndDate: Date;

	@Field(() => CouponStatus)
	couponStatus: CouponStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Coupons {
	@Field(() => [Coupon])
	list: Coupon[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
