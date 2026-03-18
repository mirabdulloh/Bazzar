import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

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

@InputType()
export class BrandOrderUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsEnum(OrderStatus)
	@Field(() => OrderStatus)
	orderStatus: OrderStatus;
}

@InputType()
export class BrandBulkOrderUpdate {
	@IsArray()
	@ArrayNotEmpty()
	@IsMongoId({ each: true })
	@Field(() => [String])
	_ids: ObjectId[];

	@IsEnum(OrderStatus)
	@Field(() => OrderStatus)
	orderStatus: OrderStatus;
}
