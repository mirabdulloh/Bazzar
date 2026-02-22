import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponResolver } from './coupon.resolver';
import { CouponService } from './coupon.service';
import { AuthModule } from '../auth/auth.module';
import CouponSchema from '../../schemas/Coupons.model';
import MemberSchema from '../../schemas/Member.model';
import OrderItemSchema from '../../schemas/OrderItems.model';
import ProductSchema from '../../schemas/Product.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Coupon', schema: CouponSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'OrderItem', schema: OrderItemSchema },
			{ name: 'Product', schema: ProductSchema },
		]),
		AuthModule,
	],
	providers: [CouponResolver, CouponService],
	exports: [CouponService],
})
export class CouponModule {}
