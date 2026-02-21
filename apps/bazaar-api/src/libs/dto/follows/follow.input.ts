import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
class FollowSearch {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followerId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followingId?: ObjectId;
}

@InputType()
export class FollowInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => FollowSearch, { nullable: true })
	search?: FollowSearch;
}
