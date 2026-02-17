import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Address {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

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
}
