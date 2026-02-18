import { Field, ObjectType } from '@nestjs/graphql';
import { ViewGroup } from '../../enums/view.enum';
import { Member } from '../member/member';
import { ObjectId } from 'mongoose';
@ObjectType()
export class View {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ViewGroup)
	viewGroup: ViewGroup;

	@Field(() => String)
	viewRefId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;
}
