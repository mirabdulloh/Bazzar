import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderItemSchema from '../../schemas/OrderItems.model';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'OrderItem', schema: OrderItemSchema }])],
	exports: [MongooseModule],
})
export class OrderItmesModule {}
