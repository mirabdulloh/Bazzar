import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CommentGroup, CommentStatus } from '../../enums/comments.enum';

@InputType()
export class CommentUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsEnum(CommentStatus)
	@Field(() => CommentStatus, { nullable: true })
	commentStatus?: CommentStatus;

	@IsOptional()
	@IsEnum(CommentGroup)
	@Field(() => CommentGroup, { nullable: true })
	commentGroup?: CommentGroup;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	commentRefId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	commentReplyId?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	commentContent?: string;

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
