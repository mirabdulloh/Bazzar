import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { CouponStatus, DiscountType } from '../../enums/coupons.enum';

@ObjectType()
export class Coupon {
	@Field(() => String)
	_id: string;

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
