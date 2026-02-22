import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	IsArray,
	IsEnum,
	IsIn,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { ReviewStatus } from '../../enums/review.enum';
import { availableReviewSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ReviewInput {
	@IsMongoId()
	@Field(() => String)
	productId: ObjectId;

	@IsMongoId()
	@Field(() => String)
	orderItemId: ObjectId;

	@IsNumber()
	@Min(1)
	@Max(5)
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

	// Internal — set by service from @AuthMember
	memberId?: ObjectId;
}

@InputType()
class ReviewSearch {
	@IsMongoId()
	@Field(() => String)
	productId: ObjectId;
}

@InputType()
class AllReviewSearch {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productId?: ObjectId;

	@IsOptional()
	@IsEnum(ReviewStatus)
	@Field(() => ReviewStatus, { nullable: true })
	reviewStatus?: ReviewStatus;
}

@InputType()
export class ReviewsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReviewSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ReviewSearch, { nullable: true })
	search?: ReviewSearch;
}

@InputType()
export class AllReviewsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReviewSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => AllReviewSearch, { nullable: true })
	search?: AllReviewSearch;
}
