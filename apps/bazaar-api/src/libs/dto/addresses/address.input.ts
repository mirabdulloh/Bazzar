import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { AddressStatus } from '../../enums/address.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class AddressSearchInput {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsEnum(AddressStatus)
	@Field(() => AddressStatus, { nullable: true })
	addressStatus?: AddressStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AddressesInquiry {
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
	@Field(() => AddressSearchInput, { nullable: true })
	search?: AddressSearchInput;
}

@InputType()
export class AddressInput {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressName: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressPhone: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressCountry: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressCity: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressZipCode: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	addressLine1: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	addressLine2?: string;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isDefault?: boolean;
}
