import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ProductSchema from '../../schemas/Product.model';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { ViewModule } from '../view/view.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
		AuthModule,
		MemberModule,
		LikeModule,
		ViewModule,
	],
	providers: [ProductsService, ProductsResolver],
	exports: [ProductsService],
})
export class ProductsModule {}
