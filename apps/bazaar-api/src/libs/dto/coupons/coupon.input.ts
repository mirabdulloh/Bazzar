import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CouponStatus, DiscountType } from '../../enums/coupons.enum';

@InputType()
export class CouponInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	couponCode: string;

	@IsOptional()
	@IsEnum(DiscountType)
	@Field(() => DiscountType, { nullable: true })
	discountType?: DiscountType;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	discountValue: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	couponUsageCount?: number;

	@IsDate()
	@Field(() => Date)
	couponStartDate: Date;

	@IsDate()
	@Field(() => Date)
	couponEndDate: Date;

	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;
}
