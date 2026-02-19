import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { BrandStatus } from '../../enums/brand.enum';

// ! Brand owner can only update profile info — NOT status
@InputType()
export class BrandUpdate {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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
}

// ! Admin can update status, suspend, delete — NOT the brand owner
@InputType()
export class BrandUpdateByAdmin {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
