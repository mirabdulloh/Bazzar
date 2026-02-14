import { NestFactory } from '@nestjs/core';
import { BazaarBatchModule } from './bazaar-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BazaarBatchModule);
  await app.listen(process.env.PORT_BATCH ?? 3000);
}
bootstrap();
