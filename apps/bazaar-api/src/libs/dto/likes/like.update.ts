import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { LikeGroup } from '../../enums/likes.enum';

@InputType()
export class LikeUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsEnum(LikeGroup)
	@Field(() => LikeGroup, { nullable: true })
	likeGroup?: LikeGroup;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	likeRefId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;
}
