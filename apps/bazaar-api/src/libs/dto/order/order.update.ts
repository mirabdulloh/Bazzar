import { Field, Float, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	orderTotalPrice?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	orderTotalDiscountPrice?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	orderFinalPrice?: number;

	@IsOptional()
	@IsEnum(OrderPaymentMethod)
	@Field(() => OrderPaymentMethod, { nullable: true })
	orderPaymentMethod?: OrderPaymentMethod;

	@IsOptional()
	@IsEnum(OrderPaymentStatus)
	@Field(() => OrderPaymentStatus, { nullable: true })
	orderPaymentStatus?: OrderPaymentStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	orderDeliveryAddressId?: ObjectId;

	@IsOptional()
	@IsEnum(OrderDeliveryStatus)
	@Field(() => OrderDeliveryStatus, { nullable: true })
	orderDeliveryStatus?: OrderDeliveryStatus;
}
