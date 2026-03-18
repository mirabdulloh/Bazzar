import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ChatRequesterType, ChatScope, ChatStatus } from '../../enums/chat.enum';

@InputType()
export class OpenBrandChatInput {
	@IsMongoId()
	@Field(() => String)
	brandId: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	chatSubject?: string;
}

@InputType()
export class OpenSupportChatInput {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	supportTopic?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	sourcePath?: string;
}

@InputType()
class ChatsSearch {
	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;

	@IsOptional()
	@IsEnum(ChatScope)
	@Field(() => ChatScope, { nullable: true })
	chatScope?: ChatScope;

	@IsOptional()
	@IsEnum(ChatRequesterType)
	@Field(() => ChatRequesterType, { nullable: true })
	requesterType?: ChatRequesterType;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	requesterId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	brandId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	assignedAdminId?: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	keyword?: string;
}

@InputType()
export class ChatsInquiry {
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

	@IsOptional()
	@Field(() => ChatsSearch, { nullable: true })
	search?: ChatsSearch;
}

@InputType()
export class ChatsInquiryByAdmin extends ChatsInquiry {}

@InputType()
export class GetChatInput {
	@IsMongoId()
	@Field(() => String)
	chatId: ObjectId;
}
