import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';

@InputType()
export class ArticleInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsOptional()
	@IsEnum(ArticleStatus)
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

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

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	articleViews?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	articleLikes?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	articleComments?: number;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	publishedAt?: Date;
}
