import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { BrandStatus } from '../../enums/brand.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class BrandInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	brandName: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	brandLogo: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandDesc?: string;
}

// ! Search classes BEFORE inquiry classes

@InputType()
class BrandsSearch {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class BrandsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'brandRating', 'brandFollowersCount'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BrandsSearch, { nullable: true })
	search?: BrandsSearch;
}

@InputType()
class AllBrandsSearch {
	@IsOptional()
	@IsEnum(BrandStatus)
	@Field(() => BrandStatus, { nullable: true })
	brandStatus?: BrandStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllBrandsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'brandRating', 'brandFollowersCount'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => AllBrandsSearch, { nullable: true })
	search?: AllBrandsSearch;
}
