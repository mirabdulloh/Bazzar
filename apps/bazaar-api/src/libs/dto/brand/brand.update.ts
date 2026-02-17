import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BrandStatus } from '../../enums/brand.enum';

@InputType()
export class BrandUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandName?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandLogo?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandDesc?: string;

	@IsOptional()
	@IsEnum(BrandStatus)
	@Field(() => BrandStatus, { nullable: true })
	brandStatus?: BrandStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	brandRating?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	brandFollowersCount?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	brandReviewsCount?: number;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
