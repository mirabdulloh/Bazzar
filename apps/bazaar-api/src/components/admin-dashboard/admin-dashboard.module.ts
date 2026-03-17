import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BrandSchema from '../../schemas/Brand.model';
import MemberSchema from '../../schemas/Member.model';
import OrderSchema from '../../schemas/Order.model';
import CouponSchema from '../../schemas/Coupons.model';
import ArticleSchema from '../../schemas/Articles.model';
import ReviewSchema from '../../schemas/Review.model';
import { AuthModule } from '../auth/auth.module';
import { AdminDashboardResolver } from './admin-dashboard.resolver';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Brand', schema: BrandSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Order', schema: OrderSchema },
			{ name: 'Coupon', schema: CouponSchema },
			{ name: 'BoardArticle', schema: ArticleSchema },
			{ name: 'Review', schema: ReviewSchema },
		]),
		AuthModule,
	],
	providers: [AdminDashboardResolver, AdminDashboardService],
})
export class AdminDashboardModule {}
