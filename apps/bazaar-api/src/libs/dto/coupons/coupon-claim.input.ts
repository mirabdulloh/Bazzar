import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { CouponClaimStatus } from '../../enums/coupons.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
class CouponClaimsSearch {
	@IsOptional()
	@IsEnum(CouponClaimStatus)
	@Field(() => CouponClaimStatus, { nullable: true })
	claimStatus?: CouponClaimStatus;
}

@InputType()
export class CouponClaimsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'claimedAt', 'usedAt'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => CouponClaimsSearch, { nullable: true })
	search?: CouponClaimsSearch;
}
