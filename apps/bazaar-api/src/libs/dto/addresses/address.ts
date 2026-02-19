import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member } from '../member/member';

@ObjectType()
export class Address {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	addressName: string;

	@Field(() => String)
	addressPhone: string;

	@Field(() => String)
	addressCountry: string;

	@Field(() => String)
	addressCity: string;

	@Field(() => String)
	addressZipCode: string;

	@Field(() => String)
	addressLine1: string;

	@Field(() => String, { nullable: true })
	addressLine2?: string;

	@Field(() => Boolean)
	isDefault: boolean;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;
}
