import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';
import { Member } from '../member/member';

@ObjectType()
export class Article {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => ArticleCategory)
	articleCategory: ArticleCategory;

	@Field(() => ArticleStatus)
	articleStatus: ArticleStatus;

	@Field(() => String)
	articleTitle: string;

	@Field(() => String)
	articleContent: string;

	@Field(() => [String])
	articleImages: string[];

	@Field(() => Int)
	articleViews: number;

	@Field(() => Int)
	articleLikes: number;

	@Field(() => Int)
	articleComments: number;

	@Field(() => Date, { nullable: true })
	publishedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;
}
