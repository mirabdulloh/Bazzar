import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ChatMessageType } from '../../enums/chat.enum';

@InputType()
export class SendMessageInput {
	@IsMongoId()
	@Field(() => String)
	conversationId: ObjectId;

	@IsEnum(ChatMessageType)
	@Field(() => ChatMessageType)
	messageType: ChatMessageType;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	message?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	attachments?: string[];

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	replyToId?: ObjectId;
}

@InputType()
export class MessagesSearch {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@IsEnum(ChatMessageType)
	@Field(() => ChatMessageType, { nullable: true })
	messageType?: ChatMessageType;
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

	@IsOptional()
	@Field(() => MessagesSearch, { nullable: true })
	search?: MessagesSearch;
}
