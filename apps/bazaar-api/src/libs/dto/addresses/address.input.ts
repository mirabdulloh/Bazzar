import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class AddressInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

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
