import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { FaqCategory, FaqStatus } from '../../enums/faqs.enum';
import { MetaCounter } from '../member/member';

@ObjectType()
export class Faq {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => FaqCategory)
	faqCategory: FaqCategory;

	@Field(() => FaqStatus)
	faqStatus: FaqStatus;

	@Field(() => String)
	faqQuestion: string;

	@Field(() => String)
	faqAnswer: string;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Faqs {
	@Field(() => [Faq])
	list: Faq[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
