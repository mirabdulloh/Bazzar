import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';

@InputType()
export class ArticleUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

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

}
