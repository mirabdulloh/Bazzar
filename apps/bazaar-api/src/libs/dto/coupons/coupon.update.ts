import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CouponStatus, DiscountType } from '../../enums/coupons.enum';

@InputType()
export class CouponUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	couponCode?: string;

	@IsOptional()
	@IsEnum(DiscountType)
	@Field(() => DiscountType, { nullable: true })
	discountType?: DiscountType;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	discountValue?: number;

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

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	couponStartDate?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	couponEndDate?: Date;

	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;
}
