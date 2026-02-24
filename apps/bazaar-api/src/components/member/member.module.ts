import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MemberHttpController } from './member-http.controller';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import BrandSchema from '../../schemas/Brand.model';
import CouponSchema from '../../schemas/Coupons.model';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';
import { ViewModule } from '../view/view.module';
import { MailModule } from '../mail/mail.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Brand', schema: BrandSchema },
			{ name: 'Coupon', schema: CouponSchema },
		]),
		AuthModule,
		LikeModule,
		ViewModule,
		MailModule,
	],
	controllers: [MemberHttpController],
	providers: [MemberResolver, MemberService],
	exports: [MemberService],
})
export class MemberModule {}
