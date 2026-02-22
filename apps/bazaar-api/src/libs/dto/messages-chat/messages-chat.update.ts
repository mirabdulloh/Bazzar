import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
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
}
