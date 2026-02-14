import { Module } from '@nestjs/common';
import { BazaarBatchController } from './bazaar-batch.controller';
import { BazaarBatchService } from './bazaar-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [BazaarBatchController],
  providers: [BazaarBatchService],
})
export class BazaarBatchModule {}
