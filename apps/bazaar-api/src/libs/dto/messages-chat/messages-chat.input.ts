import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

// Sent by member or brand to add a message to a conversation
@InputType()
export class SendMessageInput {
	@IsMongoId()
	@Field(() => String)
	conversationId: ObjectId;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	message: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	attachments?: string[];
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsMongoId()
	@Field(() => String)
	conversationId: ObjectId;
}
