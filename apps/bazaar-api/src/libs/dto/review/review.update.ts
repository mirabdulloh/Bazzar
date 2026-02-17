import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ReviewStatus } from '../../enums/review.enum';

@InputType()
export class ReviewUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	orderItemId?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	reviewRating?: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	reviewComment?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	reviewImages?: string[];

	@IsOptional()
	@IsEnum(ReviewStatus)
	@Field(() => ReviewStatus, { nullable: true })
	reviewStatus?: ReviewStatus;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	reviewLikes?: number;
}
