import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponResolver } from './coupon.resolver';
import { CouponService } from './coupon.service';
import { AuthModule } from '../auth/auth.module';
import CouponSchema from '../../schemas/Coupons.model';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Coupon', schema: CouponSchema }]), AuthModule],
	providers: [CouponResolver, CouponService],
})
export class CouponModule {}
