import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/views/view';
import { ViewInput } from '../../libs/dto/views/view.input';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { ProductsData } from '../../libs/dto/product/product';
import { T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (!viewExist) {
			console.log('- New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId, viewGroup } = input;
		const search: T = { memberId, viewRefId, viewGroup };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<ProductsData> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.PRODUCT, memberId };

		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'products',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedProduct',
					},
				},
				{
					$unwind: '$visitedProduct',
				},
				{
					$lookup: {
						from: 'members',
						localField: 'visitedProduct.memberId',
						foreignField: '_id',
						as: 'visitedProduct.memberData',
					},
				},
				{
					$unwind: '$visitedProduct.memberData',
				},
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		console.log('data => ', data);
		const products = data[0]?.list?.map((ele) => ele.visitedProduct) ?? [];
		const total = data[0]?.metaCounter?.[0]?.total ?? 0;

		return {
			products,
			metaData: { total, page, limit },
		};
	}
}
