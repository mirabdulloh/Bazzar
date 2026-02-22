import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ChatStatus } from '../../enums/chat.enum';

@InputType()
export class ChatUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;
}
