import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReviewStatus } from '../../enums/review.enum';
import { Member, MetaCounter } from '../member/member';
import { Product } from '../product/product';
import { OrderItem } from '../order-items/order-item';

@ObjectType()
export class Review {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	productId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	orderItemId: ObjectId;

	@Field(() => Float)
	reviewRating: number;

	@Field(() => String)
	reviewComment: string;

	@Field(() => [String])
	reviewImages: string[];

	@Field(() => ReviewStatus)
	reviewStatus: ReviewStatus;

	@Field(() => Int)
	reviewLikes: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Product, { nullable: true })
	productData?: Product;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => OrderItem, { nullable: true })
	orderItemData?: OrderItem;
}

@ObjectType()
export class Reviews {
	@Field(() => [Review])
	list: Review[];

	@Field(() => [MetaCounter])
	metaCounter: MetaCounter[];
}
