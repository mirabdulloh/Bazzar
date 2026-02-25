import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { AddressStatus } from '../../enums/address.enum';

// ! User — can only update address content fields, NOT status or ownership
@InputType()
export class AddressUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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

// ! Admin — can update any field including status and ownership
@InputType()
export class AddressUpdateByAdmin {
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

	@IsOptional()
	@IsEnum(AddressStatus)
	@Field(() => AddressStatus, { nullable: true })
	addressStatus?: AddressStatus;
}
