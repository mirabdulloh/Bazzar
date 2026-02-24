import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ChatStatus } from '../../enums/chat.enum';

// Member opens (or reopens) a conversation with a brand
@InputType()
export class OpenChatInput {
	@IsMongoId()
	@Field(() => String)
	brandId: ObjectId;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	chatSubject: string;
}

@InputType()
class ChatsSearch {
	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	brandId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
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
class ChatsSearchByAdmin {
	@IsOptional()
	@IsEnum(ChatStatus)
	@Field(() => ChatStatus, { nullable: true })
	chatStatus?: ChatStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	brandId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
}

@InputType()
export class ChatsInquiryByAdmin {
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
	@Field(() => ChatsSearchByAdmin, { nullable: true })
	search?: ChatsSearchByAdmin;
}
