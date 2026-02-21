import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/articles.enum';
import { Member, MetaCounter } from '../member/member';
import { MeLiked } from '../likes/like';

@ObjectType()
export class Article {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

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
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Articles {
	@Field(() => [Article])
	list: Article[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
