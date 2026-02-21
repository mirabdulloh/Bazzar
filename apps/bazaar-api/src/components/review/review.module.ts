import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import ReviewSchema from '../../schemas/Review.model';
import ProductSchema from '../../schemas/Product.model';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItems.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Review', schema: ReviewSchema },
			{ name: 'Product', schema: ProductSchema },
			{ name: 'Order', schema: OrderSchema },
			{ name: 'OrderItem', schema: OrderItemSchema },
		]),
		AuthModule,
	],
	providers: [ReviewResolver, ReviewService],
})
export class ReviewModule {}
