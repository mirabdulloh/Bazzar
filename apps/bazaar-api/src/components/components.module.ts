import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';
import { ProductsModule } from './products/products.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrderModule } from './order/order.module';
import { OrderItmesModule } from './order-itmes/order-itmes.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';

@Module({
	imports: [
		MemberModule,
		BrandModule,
		CategoryModule,
		ProductsModule,
		AddressesModule,
		OrderModule,
		OrderItmesModule,
		LikeModule,
		ViewModule,
	],
})
export class ComponentsModule {}
