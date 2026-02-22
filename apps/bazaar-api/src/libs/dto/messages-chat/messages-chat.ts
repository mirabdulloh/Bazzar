import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, MetaCounter } from '../member/member';
import { Chat } from '../chat/chat';

@ObjectType()
export class MessageChat {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationId: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	message: string;

	@Field(() => [String])
	attachments: string[];

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// Relationship
	@Field(() => Chat, { nullable: true })
	conversationData?: Chat;

	@Field(() => Member, { nullable: true })
	senderData?: Member;
}

@ObjectType()
export class MessageChats {
	@Field(() => [MessageChat])
	list: MessageChat[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
