import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';

@InputType()
export class ArticleUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsOptional()
	@IsEnum(ArticleStatus)
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	articleContent?: string;

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
