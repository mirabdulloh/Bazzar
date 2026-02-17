import { Field, Float, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

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
	orderDeliveryAddressId: string;

	@IsOptional()
	@IsEnum(OrderDeliveryStatus)
	@Field(() => OrderDeliveryStatus, { nullable: true })
	orderDeliveryStatus?: OrderDeliveryStatus;
}
