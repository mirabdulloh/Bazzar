import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class OrderItemUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	orderId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productId?: ObjectId;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	priceAtPurchase?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Field(() => Int, { nullable: true })
	itemQuantity?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	subtotal?: number;
}
