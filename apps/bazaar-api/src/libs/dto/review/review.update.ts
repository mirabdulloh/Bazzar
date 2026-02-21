import { Field, Float, InputType } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ReviewStatus } from '../../enums/review.enum';

@InputType()
export class ReviewUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(5)
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
}
