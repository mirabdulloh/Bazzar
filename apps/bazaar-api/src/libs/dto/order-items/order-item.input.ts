import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsMongoId, IsNumber, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class OrderItemInput {
	@IsMongoId()
	@Field(() => String)
	orderId: ObjectId;

	@IsMongoId()
	@Field(() => String)
	productId: ObjectId;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	priceAtPurchase: number;

	@IsNumber()
	@Min(1)
	@Field(() => Int)
	itemQuantity: number;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	subtotal: number;
}
