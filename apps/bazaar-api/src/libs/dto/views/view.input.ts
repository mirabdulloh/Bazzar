import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class ViewInput {
	@IsEnum(ViewGroup)
	@Field(() => ViewGroup)
	viewGroup: ViewGroup;

	@IsMongoId()
	@Field(() => String)
	viewRefId: string;

	@IsMongoId()
	@Field(() => String)
	memberId: string;
}
