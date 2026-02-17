import { Field, ObjectType } from '@nestjs/graphql';
import { ChatStatus } from '../../enums/chat.enum';

@ObjectType()
export class Chat {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => String)
	brandId: string;

	@Field(() => ChatStatus)
	chatStatus: ChatStatus;

	@Field(() => String)
	chatSubject: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
