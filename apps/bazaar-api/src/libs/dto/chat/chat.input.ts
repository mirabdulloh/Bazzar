import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ChatStatus } from '../../enums/chat.enum';

@InputType()
export class ChatInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsMongoId()
	@Field(() => String)
	brandId: string;

	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	chatSubject: string;
}
