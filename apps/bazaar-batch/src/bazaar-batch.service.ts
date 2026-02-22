import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberStatus, MemberType } from 'apps/bazaar-api/src/libs/enums/member.enum';
import { ProductStatus } from 'apps/bazaar-api/src/libs/enums/products.enum';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
	) {}

	public async batchRollBack(): Promise<void> {
		console.log('Executing batchRollBack...');
		await Promise.all([
			this.productModel.updateMany({ productStatus: ProductStatus.ACTIVE }, { productRank: 0 }),
			this.memberModel.updateMany(
				{ memberStatus: MemberStatus.ACTIVE, memberType: MemberType.BRAND },
				{ memberRank: 0 },
			),
		]);
	}

	public async batchTopProducts(): Promise<void> {
		console.log('Executing batchTopProducts...');
		const products = await this.productModel.find({ productStatus: ProductStatus.ACTIVE, productRank: 0 }).exec();

		await Promise.all(
			products.map((p) =>
				this.productModel.updateOne({ _id: p._id }, { productRank: p.productLikes * 2 + p.productViews * 1 }),
			),
		);
	}

	public async batchTopBrands(): Promise<void> {
		console.log('Executing batchTopBrands...');
		const brands = await this.memberModel
			.find({ memberStatus: MemberStatus.ACTIVE, memberType: MemberType.BRAND, memberRank: 0 })
			.exec();

		await Promise.all(
			brands.map((b) =>
				this.memberModel.updateOne(
					{ _id: b._id },
					{
						memberRank: b.memberProducts * 5 + b.memberLikes * 2 + b.memberFollowers * 3 + b.memberViews * 1,
					},
				),
			),
		);
	}

	getHello(): string {
		return 'Welcome to Bazaar Batch Server!';
	}
}
