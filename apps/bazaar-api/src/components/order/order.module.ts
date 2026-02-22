import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItems.model';
import ProductSchema from '../../schemas/Product.model';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ProductsModule } from '../products/products.module';
import { CouponModule } from '../coupon/coupon.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Order', schema: OrderSchema },
			{ name: 'OrderItem', schema: OrderItemSchema },
			{ name: 'Product', schema: ProductSchema },
		]),
		AuthModule,
		MemberModule,
		ProductsModule,
		CouponModule,
		NotificationModule,
		MailModule,
	],
	providers: [OrderService, OrderResolver],
	exports: [OrderService],
})
export class OrderModule {}
