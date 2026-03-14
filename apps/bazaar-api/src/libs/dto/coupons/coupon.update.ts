import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { CouponStatus, DiscountType } from '../../enums/coupons.enum';

// Brand — can update their own brand coupon; cannot change couponStatus (admin only)
@InputType()
export class BrandCouponUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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
	@Type(() => Number)
	@Field(() => Float, { nullable: true })
	discountValue?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	@Field(() => Int, { nullable: true })
	minOrderCount?: number;

	@IsOptional()
	@IsDate()
	@Type(() => Date)
	@Field(() => Date, { nullable: true })
	couponStartDate?: Date;

	@IsOptional()
	@IsDate()
	@Type(() => Date)
	@Field(() => Date, { nullable: true })
	couponEndDate?: Date;

	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;
}

@InputType()
export class CouponUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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
	@Type(() => Number)
	@Field(() => Float, { nullable: true })
	discountValue?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	@Field(() => Int, { nullable: true })
	minOrderCount?: number;

	@IsOptional()
	@IsDate()
	@Type(() => Date)
	@Field(() => Date, { nullable: true })
	couponStartDate?: Date;

	@IsOptional()
	@IsDate()
	@Type(() => Date)
	@Field(() => Date, { nullable: true })
	couponEndDate?: Date;

	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;
}
