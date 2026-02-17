import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ProductsModule } from './products/products.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrderModule } from './order/order.module';
import { OrderItmesModule } from './order-itmes/order-itmes.module';

@Module({
  imports: [MemberModule, ProductsModule, AddressesModule, OrderModule, OrderItmesModule]
})
export class ComponentsModule {}
