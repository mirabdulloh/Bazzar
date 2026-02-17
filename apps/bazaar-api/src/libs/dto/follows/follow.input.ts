import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';

@InputType()
export class FollowInput {
	@IsMongoId()
	@Field(() => String)
	followingId: string;

	@IsMongoId()
	@Field(() => String)
	followerId: string;
}
