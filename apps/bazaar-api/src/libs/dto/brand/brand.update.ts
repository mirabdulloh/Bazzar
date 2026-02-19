import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { BrandStatus } from '../../enums/brand.enum';

@InputType()
export class BrandUpdate {
	// _id = memberId (Brand's _id is the same as the owning member's _id)
	@IsMongoId()
	@Field(() => String)
	_id: string;

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
