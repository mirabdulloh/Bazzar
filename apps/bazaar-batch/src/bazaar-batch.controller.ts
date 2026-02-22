import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './bazaar-batch.service';
import { Cron, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_BRANDS, BATCH_TOP_PRODUCTS } from './lib/config';

@Controller()
export class BatchController {
	private logger: Logger = new Logger('BatchController');
	constructor(private readonly batchService: BatchService) {}

	@Timeout(1000)
	handleInterval() {
		this.logger['context'] = 'SERVER READY';
		this.logger.debug('BATCH SERVER READY!!!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK })
	public async batchRollBack() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTE ROLLBACK BATCH JOB');
			await this.batchService.batchRollBack();
		} catch (err) {
			this.logger.error('ROLLBACK BATCH JOB FAILED', err);
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_PRODUCTS })
	public async batchTopProducts() {
		try {
			this.logger['context'] = BATCH_TOP_PRODUCTS;
			this.logger.debug('EXECUTE TOP PRODUCTS BATCH JOB');
			await this.batchService.batchTopProducts();
		} catch (err) {
			this.logger.error('TOP PRODUCTS BATCH JOB FAILED', err);
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_TOP_BRANDS })
	public async batchTopBrands() {
		try {
			this.logger['context'] = BATCH_TOP_BRANDS;
			this.logger.debug('EXECUTE TOP BRANDS BATCH JOB');
			await this.batchService.batchTopBrands();
		} catch (err) {
			this.logger.error('TOP BRANDS BATCH JOB FAILED', err);
		}
	}

	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
