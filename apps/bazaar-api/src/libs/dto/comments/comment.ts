import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CommentGroup, CommentStatus } from '../../enums/comments.enum';
import { Member } from '../member/member';

@ObjectType()
export class Comment {
	@Field(() => String)
	_id: string;

	@Field(() => CommentStatus)
	commentStatus: CommentStatus;

	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@Field(() => String)
	commentRefId: string;

	@Field(() => String)
	memberId: string;

	@Field(() => String, { nullable: true })
	commentReplyId?: string;

	@Field(() => String)
	commentContent: string;

	@Field(() => Int)
	commentLikes: number;

	@Field(() => Int)
	commentViews: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;

	@Field(() => Comment, { nullable: true })
	parentComment?: Comment;
}
