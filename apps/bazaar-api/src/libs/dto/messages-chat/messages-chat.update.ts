import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class MessageChatUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	message?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	attachments?: string[];
}

@InputType()
export class RemoveMessageInput {
	@IsMongoId()
	@Field(() => String)
	messageId: ObjectId;

	@IsBoolean()
	@Field(() => Boolean)
	deleteForEveryone: boolean;
}
