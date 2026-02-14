import { Test, TestingModule } from '@nestjs/testing';
import { BazaarBatchController } from './bazaar-batch.controller';
import { BazaarBatchService } from './bazaar-batch.service';

describe('BazaarBatchController', () => {
  let bazaarBatchController: BazaarBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BazaarBatchController],
      providers: [BazaarBatchService],
    }).compile();

    bazaarBatchController = app.get<BazaarBatchController>(BazaarBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(bazaarBatchController.getHello()).toBe('Hello World!');
    });
  });
});
