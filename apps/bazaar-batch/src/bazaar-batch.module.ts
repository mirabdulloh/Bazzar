import { Module } from '@nestjs/common';
import { BatchController } from './bazaar-batch.controller';
import { BatchService } from './bazaar-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import ProductSchema from 'apps/bazaar-api/src/schemas/Product.model';
import MemberSchema from 'apps/bazaar-api/src/schemas/Member.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: 'Product', schema: ProductSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
