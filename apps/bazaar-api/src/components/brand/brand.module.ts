import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BrandSchema from '../../schemas/Brand.model';
import MemberSchema from '../../schemas/Member.model';
import { BrandService } from './brand.service';
import { BrandResolver } from './brand.resolver';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Brand', schema: BrandSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		ViewModule,
	],
	providers: [BrandService, BrandResolver],
	exports: [BrandService, MongooseModule],
})
export class BrandModule {}
