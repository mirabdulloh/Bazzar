import { Injectable } from '@nestjs/common';

@Injectable()
export class BazaarBatchService {
  getHello(): string {
    return 'This is bazaar-batch server!';
  }
}
