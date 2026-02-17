import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Order } from '../order/order';
import { Product } from '../product/product';

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	orderId: string;

	@Field(() => String)
	productId: string;

	@Field(() => Float)
	priceAtPurchase: number;

	@Field(() => Int)
	itemQuantity: number;

	@Field(() => Float)
	subtotal: number;

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
