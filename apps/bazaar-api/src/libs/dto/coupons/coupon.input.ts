import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CouponStatus, CouponType, DiscountType } from '../../enums/coupons.enum';
import { Direction } from '../../enums/common.enum';
import { availableCouponSorts } from '../../config';

/** Admin — full control, can set brandId explicitly */
@InputType()
export class CouponInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	couponCode: string;

	@IsOptional()
	@IsEnum(CouponType)
	@Field(() => CouponType, { nullable: true })
	couponType?: CouponType;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	brandId?: string;

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
	@Min(1)
	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	minOrderCount?: number;

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

/** Brand member — brandId is taken from @AuthMember, couponType forced to BRAND */
@InputType()
export class BrandCouponInput {
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
	@Min(1)
	@Field(() => Int, { nullable: true })
	couponMaxUsage?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	minOrderCount?: number;

	@IsDate()
	@Field(() => Date)
	couponStartDate: Date;

	@IsDate()
	@Field(() => Date)
	couponEndDate: Date;
}

@InputType()
class CouponSearch {
	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;

	@IsOptional()
	@IsEnum(CouponType)
	@Field(() => CouponType, { nullable: true })
	couponType?: CouponType;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class CouponsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCouponSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => CouponSearch, { nullable: true })
	search?: CouponSearch;
}

/** Brand — list own coupons with optional status filter */
@InputType()
class BrandCouponSearch {
	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;
}

@InputType()
export class BrandCouponsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCouponSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BrandCouponSearch, { nullable: true })
	search?: BrandCouponSearch;
}
