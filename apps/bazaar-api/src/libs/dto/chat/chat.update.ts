import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ChatStatus } from '../../enums/chat.enum';

@InputType()
export class ChatUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	brandId?: string;

	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	chatSubject?: string;
}
