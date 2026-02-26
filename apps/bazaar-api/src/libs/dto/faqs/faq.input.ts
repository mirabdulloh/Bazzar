import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { FaqCategory, FaqStatus } from '../../enums/faqs.enum';
import { availableFaqSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class FaqInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	faqQuestion: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	faqAnswer: string;

	@IsOptional()
	@IsEnum(FaqCategory)
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;
}

@InputType()
class FaqSearch {
	@IsOptional()
	@IsEnum(FaqCategory)
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class FaqsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableFaqSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => FaqSearch, { nullable: true })
	search?: FaqSearch;
}

@InputType()
class FaqSearchByAdmin {
	@IsOptional()
	@IsEnum(FaqCategory)
	@Field(() => FaqCategory, { nullable: true })
	faqCategory?: FaqCategory;

	@IsOptional()
	@IsEnum(FaqStatus)
	@Field(() => FaqStatus, { nullable: true })
	faqStatus?: FaqStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class FaqsInquiryByAdmin {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableFaqSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => FaqSearchByAdmin, { nullable: true })
	search?: FaqSearchByAdmin;
}
