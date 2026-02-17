import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoryStatus } from '../../enums/cattegory.enum';

@InputType()
export class CategoryInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	categoryName: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	parentCategoryId?: string;

	@IsOptional()
	@IsEnum(CategoryStatus)
	@Field(() => CategoryStatus, { nullable: true })
	categoryStatus?: CategoryStatus;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
