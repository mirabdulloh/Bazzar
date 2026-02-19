import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CategoryStatus } from '../../enums/cattegory.enum';

@InputType()
export class CategoryUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	categoryName?: string;

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
