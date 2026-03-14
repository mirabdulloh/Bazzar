import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	IsArray,
	IsEnum,
	IsIn,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';
import { Direction } from '../../enums/common.enum';

// ! CreateOrderItemInput - items sent by client when creating an order
@InputType()
export class CreateOrderItemInput {
	@IsMongoId()
	@Field(() => String)
	productId: ObjectId;

	@IsNumber()
	@Min(1)
	@Field(() => Int)
	itemQuantity: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	selectedSize?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	selectedColor?: string;
}

// ! CreateOrderInput - what the client actually sends to create an order
@InputType()
export class CreateOrderInput {
	@IsMongoId()
	@Field(() => String)
	orderDeliveryAddressId: ObjectId;

	@IsOptional()
	@IsEnum(OrderPaymentMethod)
	@Field(() => OrderPaymentMethod, { nullable: true })
	orderPaymentMethod?: OrderPaymentMethod;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemInput)
	@Field(() => [CreateOrderItemInput])
	items: CreateOrderItemInput[];

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	couponCode?: string;
}

// ! OrderInput - raw order input (used internally)
@InputType()
export class OrderInput {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	orderTotalPrice: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	orderTotalDiscountPrice?: number;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	orderFinalPrice: number;

	@IsOptional()
	@IsEnum(OrderPaymentMethod)
	@Field(() => OrderPaymentMethod, { nullable: true })
	orderPaymentMethod?: OrderPaymentMethod;

	@IsOptional()
	@IsEnum(OrderPaymentStatus)
	@Field(() => OrderPaymentStatus, { nullable: true })
	orderPaymentStatus?: OrderPaymentStatus;

	@IsMongoId()
	@Field(() => String)
	orderDeliveryAddressId: ObjectId;

	@IsOptional()
	@IsEnum(OrderDeliveryStatus)
	@Field(() => OrderDeliveryStatus, { nullable: true })
	orderDeliveryStatus?: OrderDeliveryStatus;
}

// ! Search classes MUST be defined BEFORE inquiry classes

@InputType()
class MyOrdersSearch {
	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;
}

@InputType()
export class MyOrdersInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => MyOrdersSearch, { nullable: true })
	search?: MyOrdersSearch;
}

@InputType()
class AllOrdersSearch {
	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@IsEnum(OrderPaymentStatus)
	@Field(() => OrderPaymentStatus, { nullable: true })
	orderPaymentStatus?: OrderPaymentStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
}

@InputType()
export class AllOrdersInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'orderFinalPrice'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllOrdersSearch)
	search: AllOrdersSearch;
}

// ! Brand Orders

@InputType()
class BrandOrdersSearch {
	@IsOptional()
	@IsEnum(OrderStatus)
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;
}

@InputType()
export class BrandOrdersInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'orderFinalPrice'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BrandOrdersSearch, { nullable: true })
	search?: BrandOrdersSearch;
}
