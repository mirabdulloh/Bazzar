import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';
import { availableBoardArticleSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ArticleInput {
	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	articleTitle: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	articleContent: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	articleImages?: string[];

	// Internal — set by resolver from @AuthMember
	memberId?: ObjectId;
}

@InputType()
class ArticleSearch {
	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
}

@InputType()
export class ArticlesInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ArticleSearch, { nullable: true })
	search?: ArticleSearch;
}

@InputType()
class AllArticleSearch {
	@IsOptional()
	@IsEnum(ArticleStatus)
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;
}

@InputType()
export class AllArticlesInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => AllArticleSearch, { nullable: true })
	search?: AllArticleSearch;
}
