import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, MetaCounter } from '../member/member';
import { ChatMessageType } from '../../enums/chat.enum';
import { MemberType } from '../../enums/member.enum';

@ObjectType()
export class MessageChat {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationId: ObjectId;

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

	@Field(() => String, { nullable: true })
	replyToId?: ObjectId;

	@Field(() => [String], { nullable: true })
	readByMemberIds?: ObjectId[];

	@Field(() => Boolean)
	isReadByMe: boolean;

	@Field(() => Boolean)
	isOwnMessage: boolean;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Member, { nullable: true })
	senderData?: Member;

	@Field(() => MessageChat, { nullable: true })
	parentMessageData?: MessageChat;
}

@ObjectType()
export class MessageChats {
	@Field(() => [MessageChat])
	list: MessageChat[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
