import { Controller, Get } from '@nestjs/common';
import { BazaarBatchService } from './bazaar-batch.service';

@Controller()
export class BazaarBatchController {
  constructor(private readonly bazaarBatchService: BazaarBatchService) {}

  @Get()
  getHello(): string {
    return this.bazaarBatchService.getHello();
  }
}
