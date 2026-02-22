import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ChatStatus } from '../../enums/chat.enum';
import { Member, MetaCounter } from '../member/member';
import { Brand } from '../brand/brand';

@ObjectType()
export class Chat {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	brandId: ObjectId;

	@Field(() => ChatStatus)
	chatStatus: ChatStatus;

	@Field(() => String)
	chatSubject: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// Relationship
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Brand, { nullable: true })
	brandData?: Brand;
}

@ObjectType()
export class Chats {
	@Field(() => [Chat])
	list: Chat[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
