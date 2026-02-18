import { BadRequestException, Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { Like } from '../../libs/dto/likes/like';
import { LikeInput } from '../../libs/dto/likes/like.input';
import { LikeGroup } from '../../libs/enums/likes.enum';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { ProductsData } from '../../libs/dto/product/product';

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = { memberId: input.memberId, likeRefId: input.likeRefId },
			exist = await this.likeModel.findOne(search).exec();
		let modifier = 1;
		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			modifier = -1;
		} else {
			try {
				await this.likeModel.create(input);
			} catch (err) {
				console.log('Error on likeService Model', err.message);
				throw new BadRequestException(Message.UPDATE_FAILED);
			}
		}
		console.log(`---Like Modifier---- ${modifier}`);

		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<boolean> {
		const { memberId, likeRefId } = input;
		const result = await this.likeModel.findOne({ memberId, likeRefId }).exec();
		return !!result;
	}

	public async getFavoriteProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<ProductsData> {
		const { page, limit } = input;
		const match: T = { likeGroup: LikeGroup.PRODUCT, memberId };

		const data: T = await this.likeModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'products',
						localField: 'likeRefId',
						foreignField: '_id',
						as: 'favoriteProduct',
					},
				},
				{
					$unwind: '$favoriteProduct',
				},
				{
					$lookup: {
						from: 'members',
						localField: 'favoriteProduct.memberId',
						foreignField: '_id',
						as: 'favoriteProduct.memberData',
					},
				},
				{
					$unwind: '$favoriteProduct.memberData',
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
		const products = data[0]?.list?.map((ele) => ele.favoriteProduct) ?? [];
		const total = data[0]?.metaCounter?.[0]?.total ?? 0;

		return {
			products,
			metaData: { total, page, limit },
		};
	}
}
