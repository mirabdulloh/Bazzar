import { Field, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/likes.enum';

@ObjectType()
export class Like {
	@Field(() => String)
	_id: string;

	@Field(() => LikeGroup)
	likeGroup: LikeGroup;

	@Field(() => String)
	likeRefId: string;

	@Field(() => String)
	memberId: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
