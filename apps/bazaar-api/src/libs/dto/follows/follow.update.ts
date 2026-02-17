import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsOptional } from 'class-validator';

@InputType()
export class FollowUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followingId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followerId?: string;
}
