import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { FaqCategory, FaqStatus } from '../../enums/faqs.enum';

@InputType()
export class FaqUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	faqQuestion?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	faqAnswer?: string;

	@IsOptional()
	@IsEnum(FaqCategory)
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@IsEnum(FaqStatus)
	@Field(() => FaqStatus, { nullable: true })
	faqStatus?: FaqStatus;
}
