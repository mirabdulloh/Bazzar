import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';

@InputType()
export class MessageChatUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	conversationId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	senderId?: string;

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
	@IsDate()
	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
