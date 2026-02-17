import { Field, ObjectType } from '@nestjs/graphql';
import { ViewGroup } from '../../enums/view.enum';
import { Member } from '../member/member';

@ObjectType()
export class View {
	@Field(() => String)
	_id: string;

	@Field(() => ViewGroup)
	viewGroup: ViewGroup;

	@Field(() => String)
	viewRefId: string;

	@Field(() => String)
	memberId: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;
}
