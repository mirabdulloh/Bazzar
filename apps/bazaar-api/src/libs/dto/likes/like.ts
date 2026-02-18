import { Field, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/likes.enum';
import { Member } from '../member/member';
import { ObjectId } from 'mongoose';
@ObjectType()
export class MeLiked {
	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	likeRefId: ObjectId;

	@Field(() => Boolean)
	myFavorite: boolean;
}

@ObjectType()
export class Like {
	@Field(() => String)
	_id: string;

	@Field(() => LikeGroup)
	likeGroup: LikeGroup;

	@Field(() => String)
	likeRefId: string;

	@Field(() => String)
	memberId: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;
}
