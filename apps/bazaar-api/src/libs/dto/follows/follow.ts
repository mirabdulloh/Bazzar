import { Field, ObjectType } from '@nestjs/graphql';
import { Member } from '../member/member';

@ObjectType()
export class Follow {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	followingId: string;

	@Field(() => String)
	followerId: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	following?: Member;

	@Field(() => Member, { nullable: true })
	follower?: Member;
}
