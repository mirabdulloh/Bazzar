import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ReviewStatus } from '../../enums/review.enum';

@InputType()
export class ReviewInput {
	@IsMongoId()
	@Field(() => String)
	productId: string;

	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsMongoId()
	@Field(() => String)
	orderItemId: string;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	reviewRating: number;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	reviewComment: string;

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
