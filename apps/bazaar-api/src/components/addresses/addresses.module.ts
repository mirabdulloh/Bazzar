import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AddressSchema from '../../schemas/Addresses.model';
import { AddressesService } from './addresses.service';
import { AddressesResolver } from './addresses.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Address', schema: AddressSchema }]), AuthModule],
	providers: [AddressesService, AddressesResolver],
	exports: [AddressesService],
})
export class AddressesModule {}
