import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CommentGroup, CommentStatus } from '../../enums/comments.enum';

@InputType()
export class CommentInput {
	@IsOptional()
	@IsEnum(CommentStatus)
	@Field(() => CommentStatus, { nullable: true })
	commentStatus?: CommentStatus;

	@IsOptional()
	@IsEnum(CommentGroup)
	@Field(() => CommentGroup, { nullable: true })
	commentGroup?: CommentGroup;

	@IsMongoId()
	@Field(() => String)
	commentRefId: string;

	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	commentReplyId?: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	commentContent: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	commentLikes?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	commentViews?: number;
}
