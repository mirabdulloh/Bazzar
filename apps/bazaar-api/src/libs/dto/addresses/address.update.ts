import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class AddressUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressName?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressPhone?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressCountry?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressCity?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressZipCode?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressLine1?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressLine2?: string;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isDefault?: boolean;
}
