import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BrandStatus } from '../../enums/brand.enum';

@InputType()
export class BrandInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	brandName: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	brandLogo: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandDesc?: string;

	@IsOptional()
	@IsEnum(BrandStatus)
	@Field(() => BrandStatus, { nullable: true })
	brandStatus?: BrandStatus;

	@IsMongoId()
	@Field(() => String)
	memberId: string;

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
}
