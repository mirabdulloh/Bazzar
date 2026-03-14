import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Order } from '../order/order';
import { Product } from '../product/product';

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	orderId: ObjectId;

	@Field(() => String)
	productId: ObjectId;

	@Field(() => Float)
	priceAtPurchase: number;

	@Field(() => Int)
	itemQuantity: number;

	@Field(() => Float)
	subtotal: number;

	@Field(() => String, { nullable: true })
	selectedSize?: string;

	@Field(() => String, { nullable: true })
	selectedColor?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Order, { nullable: true })
	order?: Order;

	@Field(() => Product, { nullable: true })
	product?: Product;
}
