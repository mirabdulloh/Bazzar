import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CategoryStatus } from '../../enums/cattegory.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class CategorySearchInput {
	@IsOptional()
	@IsEnum(CategoryStatus)
	@Field(() => CategoryStatus, { nullable: true })
	categoryStatus?: CategoryStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	parentCategoryId?: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllCategoriesInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => CategorySearchInput, { nullable: true })
	search?: CategorySearchInput;
}

@InputType()
export class CategoryInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	categoryName: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	parentCategoryId?: ObjectId;

	@IsOptional()
	@IsEnum(CategoryStatus)
	@Field(() => CategoryStatus, { nullable: true })
	categoryStatus?: CategoryStatus;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
