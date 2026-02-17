import { Field, Float, ObjectType } from '@nestjs/graphql';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@ObjectType()
export class Order {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	@Field(() => Float)
	orderTotalPrice: number;

	@Field(() => Float)
	orderTotalDiscountPrice: number;

	@Field(() => Float)
	orderFinalPrice: number;

	@Field(() => OrderPaymentMethod)
	orderPaymentMethod: OrderPaymentMethod;

	@Field(() => OrderPaymentStatus)
	orderPaymentStatus: OrderPaymentStatus;

	@Field(() => String)
	orderDeliveryAddressId: string;

	@Field(() => OrderDeliveryStatus)
	orderDeliveryStatus: OrderDeliveryStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
