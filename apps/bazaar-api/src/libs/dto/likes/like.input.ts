import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { LikeGroup } from '../../enums/likes.enum';

@InputType()
export class LikeInput {
	@IsEnum(LikeGroup)
	@Field(() => LikeGroup)
	likeGroup: LikeGroup;

	@IsMongoId()
	@Field(() => String)
	likeRefId: string;

	@IsMongoId()
	@Field(() => String)
	memberId: string;
}
