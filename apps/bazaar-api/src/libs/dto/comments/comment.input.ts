import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CommentGroup } from '../../enums/comments.enum';
import { availableCommentSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class CommentInput {
	@IsEnum(CommentGroup)
	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@IsMongoId()
	@Field(() => String)
	commentRefId: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	commentReplyId?: ObjectId;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	commentContent: string;

	// Internal — set by service from memberId
	memberId?: ObjectId;
}

@InputType()
export class CommentsSearch {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	commentRefId?: ObjectId;
}

@InputType()
export class CommentsInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCommentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => CommentsSearch, { nullable: true })
	search?: CommentsSearch;
}
