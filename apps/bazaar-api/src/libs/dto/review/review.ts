import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ReviewStatus } from '../../enums/review.enum';
import { Member } from '../member/member';
import { Product } from '../product/product';
import { OrderItem } from '../order-items/order-item';

@ObjectType()
export class Review {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	productId: string;

	@Field(() => String)
	memberId: string;

	@Field(() => String)
	orderItemId: string;

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
	product?: Product;

	@Field(() => Member, { nullable: true })
	member?: Member;

	@Field(() => OrderItem, { nullable: true })
	orderItem?: OrderItem;
}
