import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CouponStatus } from '../../enums/coupons.enum';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';

@InputType()
export class MemberUpdateByAdmin {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsEnum(MemberStatus)
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@IsEnum(MemberAuthType)
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;

	@IsOptional()
	@IsString()
	@Matches(/^\+?[0-9]{7,15}$/, { message: 'memberPhone must be a valid phone number' })
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@IsString()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@IsString()
	@Length(8, 20)
	@Field(() => String, { nullable: true })
	memberPassword?: string;

	@IsOptional()
	@IsString()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberArticles?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberFollowers?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberFollowings?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberPoints?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberLikes?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberViews?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberComments?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberRank?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberWarnings?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	memberBlocks?: number;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberCouponId?: ObjectId;

	@IsOptional()
	@IsEnum(CouponStatus)
	@Field(() => CouponStatus, { nullable: true })
	memberCouponStatus?: CouponStatus;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	memberCouponUsedAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	memberCouponAssignedAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	lastLoginAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	lastActiveAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}

@InputType()
export class MemberUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsEnum(MemberAuthType)
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;

	@IsOptional()
	@IsString()
	@Matches(/^\+?[0-9]{7,15}$/, { message: 'memberPhone must be a valid phone number' })
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@IsString()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@IsString()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberDesc?: string;
}
