import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsDate, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class MessageChatInput {
	@IsMongoId()
	@Field(() => String)
	conversationId: string;

	@IsMongoId()
	@Field(() => String)
	senderId: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	message: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	attachments?: string[];

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
