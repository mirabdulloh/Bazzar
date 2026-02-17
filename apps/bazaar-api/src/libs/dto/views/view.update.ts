import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class ViewUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsEnum(ViewGroup)
	@Field(() => ViewGroup, { nullable: true })
	viewGroup?: ViewGroup;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	viewRefId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;
}
