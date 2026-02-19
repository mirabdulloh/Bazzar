import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BrandSchema from '../../schemas/Brand.model';
import { BrandService } from './brand.service';
import { BrandResolver } from './brand.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Brand', schema: BrandSchema }]), AuthModule],
	providers: [BrandService, BrandResolver],
	exports: [BrandService, MongooseModule],
})
export class BrandModule {}
