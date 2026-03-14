import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';
import { Member, MetaData } from '../member/member';
import { Address } from '../addresses/address';
import { OrderItem } from '../order-items/order-item';

@ObjectType()
export class Order {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	brandId: ObjectId;

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
	orderDeliveryAddressId: ObjectId;

	@Field(() => OrderDeliveryStatus)
	orderDeliveryStatus: OrderDeliveryStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	member?: Member;

	@Field(() => Member, { nullable: true })
	brand?: Member;

	@Field(() => Address, { nullable: true })
	deliveryAddress?: Address;

	@Field(() => [OrderItem], { nullable: true })
	orderItems?: OrderItem[];
}

@ObjectType()
export class OrdersData {
	@Field(() => [Order])
	orders: Order[];

	@Field(() => MetaData)
	metaData: MetaData;
}

@ObjectType()
export class CreatedOrdersPayload {
	@Field(() => [Order])
	orders: Order[];
}
