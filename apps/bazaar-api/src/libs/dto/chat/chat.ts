import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ChatMessageType, ChatRequesterType, ChatScope, ChatStatus } from '../../enums/chat.enum';
import { Member, MetaCounter } from '../member/member';
import { Brand } from '../brand/brand';
import { MemberType } from '../../enums/member.enum';

@ObjectType()
export class ChatLastMessage {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => MemberType)
	senderType: MemberType;

	@Field(() => ChatMessageType)
	messageType: ChatMessageType;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => [String], { nullable: true })
	attachments?: string[];

	@Field(() => Date)
	createdAt: Date;
}

@ObjectType()
export class Chat {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ChatScope)
	chatScope: ChatScope;

	@Field(() => ChatStatus)
	chatStatus: ChatStatus;

	@Field(() => String)
	requesterId: ObjectId;

	@Field(() => ChatRequesterType)
	requesterType: ChatRequesterType;

	@Field(() => String, { nullable: true })
	brandId?: ObjectId;

	@Field(() => String, { nullable: true })
	assignedAdminId?: ObjectId;

	@Field(() => String, { nullable: true })
	chatSubject?: string;

	@Field(() => String, { nullable: true })
	supportTopic?: string;

	@Field(() => String, { nullable: true })
	sourcePath?: string;

	@Field(() => String, { nullable: true })
	lastMessageId?: ObjectId;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => String, { nullable: true })
	lastMessageText?: string;

	@Field(() => String, { nullable: true })
	lastMessageSenderId?: ObjectId;

	@Field(() => Int)
	unreadRequesterCount: number;

	@Field(() => Int)
	unreadResponderCount: number;

	@Field(() => Int)
	unreadCount: number;

	@Field(() => Boolean)
	canReply: boolean;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// Relationship
	@Field(() => Member, { nullable: true })
	requesterData?: Member;

	@Field(() => Brand, { nullable: true })
	brandData?: Brand;

	@Field(() => Member, { nullable: true })
	assignedAdminData?: Member;

	@Field(() => ChatLastMessage, { nullable: true })
	lastMessage?: ChatLastMessage;
}

@ObjectType()
export class Chats {
	@Field(() => [Chat])
	list: Chat[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
