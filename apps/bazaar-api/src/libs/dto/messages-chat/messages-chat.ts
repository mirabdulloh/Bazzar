import { Field, ObjectType } from '@nestjs/graphql';
import { Chat } from '../chat/chat';
import { Member } from '../member/member';

@ObjectType()
export class MessageChat {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	conversationId: string;

	@Field(() => String)
	senderId: string;

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

	// ** Relationship Fields **
	@Field(() => Chat, { nullable: true })
	conversation?: Chat;

	@Field(() => Member, { nullable: true })
	sender?: Member;
}
