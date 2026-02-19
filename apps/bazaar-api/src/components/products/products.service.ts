import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Product, ProductsData } from '../../libs/dto/product/product';
import {
	ProductInput,
	ProductsInquiry,
	AllProductsInquiry,
	BrandProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/products.enum';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { StatisticModifier, T } from '../../libs/types/common';
import { LikeInput } from '../../libs/dto/likes/like.input';
import { LikeGroup } from '../../libs/enums/likes.enum';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { MemberService } from '../member/member.service';
import { Brand } from '../../libs/dto/brand/brand';

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<Product>,
		@InjectModel('Brand') private readonly brandModel: Model<Brand>,
		private readonly memberService: MemberService,
		private readonly likeService: LikeService,
		private readonly viewService: ViewService,
	) {}

	// ! CREATE PRODUCT
	public async createProduct(input: ProductInput): Promise<Product> {
		// Validate that brand is ACTIVE before allowing product creation
		// Brand._id === memberId (same ObjectId)
		const activeBrand = await this.brandModel
			.findOne({ _id: shapeIntoMongoObjectId(input.memberId), brandStatus: BrandStatus.ACTIVE })
			.exec();
		if (!activeBrand) {
			throw new BadRequestException('Your brand is not approved yet. Please wait for admin approval.');
		}

		try {
			const result = await this.productModel.create(input);
			// increment memberProducts stat
			await this.memberService.memberStatsEdits({
				_id: shapeIntoMongoObjectId(input.memberId),
				targetKey: 'memberProducts',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.log('Error on createProduct Service', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET SINGLE PRODUCT
	public async getProduct(memberId: ObjectId | null, productId: ObjectId): Promise<Product> {
		const search: T = {
			_id: productId,
			productStatus: { $ne: ProductStatus.DELETED },
		};

		const targetProduct = await this.productModel
			.aggregate([
				{ $match: search },
				lookupMember,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		if (!targetProduct.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		// View tracking
		if (memberId) {
			const viewInput = {
				memberId: memberId,
				viewRefId: productId,
				viewGroup: ViewGroup.PRODUCT,
			};

			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.productModel.findByIdAndUpdate(productId, { $inc: { productViews: 1 } }).exec();
				targetProduct[0].productViews++;
			}

			// Check meLiked
			const likeInput: LikeInput = {
				memberId: memberId,
				likeRefId: productId,
				likeGroup: LikeGroup.PRODUCT,
			};
			const isLiked = await this.likeService.checkLikeExistence(likeInput);
			targetProduct[0].meLiked = isLiked ? [{ memberId: memberId, likeRefId: productId, myFavorite: true }] : [];
		}

		return targetProduct[0];
	}

	// ! GET PRODUCTS (Public with pagination)
	public async getProducts(memberId: ObjectId | null, input: ProductsInquiry): Promise<ProductsData> {
		const match: T = { productStatus: ProductStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			if (input.search.memberId) match.memberId = shapeIntoMongoObjectId(input.search.memberId);
			if (input.search.productBrandId) match.productBrandId = shapeIntoMongoObjectId(input.search.productBrandId);
			if (input.search.productCategoryId)
				match.productCategoryId = shapeIntoMongoObjectId(input.search.productCategoryId);
			if (input.search.productTypeList?.length) match.productType = { $in: input.search.productTypeList };
			if (input.search.productStatus) match.productStatus = input.search.productStatus;
			if (input.search.text) match.productTitle = { $regex: new RegExp(input.search.text, 'i') };
		}

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return {
			products: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! GET BRAND PRODUCTS (Brand's own products)
	public async getBrandProducts(memberId: ObjectId, input: BrandProductsInquiry): Promise<ProductsData> {
		const match: T = { memberId: memberId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.productStatus) {
			match.productStatus = input.search.productStatus;
		}

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return {
			products: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE PRODUCT (Brand owner)
	public async updateProduct(memberId: ObjectId, input: ProductUpdate): Promise<Product> {
		const productId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const existingProduct = await this.productModel.findOne({ _id: productId, memberId: memberId }).exec();
		if (!existingProduct) throw new NotFoundException(Message.NO_DATA_FOUND);

		const result = await this.productModel.findByIdAndUpdate(productId, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	// ! LIKE TARGET PRODUCT
	public async likeTargetProduct(memberId: ObjectId, productId: ObjectId): Promise<Product> {
		const target = await this.productModel.findOne({ _id: productId, productStatus: ProductStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = { memberId, likeRefId: productId, likeGroup: LikeGroup.PRODUCT };
		const modifier: number = await this.likeService.toggleLike(input);

		const result = await this.productStatsEdits({ _id: productId, targetKey: 'productLikes', modifier });
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		return result;
	}

	// ! GET ALL PRODUCTS BY ADMIN
	public async getAllProductsByAdmin(input: AllProductsInquiry): Promise<ProductsData> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			if (input.search.productStatus) match.productStatus = input.search.productStatus;
			if (input.search.productTypeList?.length) match.productType = { $in: input.search.productTypeList };
			if (input.search.productBrandId) match.productBrandId = shapeIntoMongoObjectId(input.search.productBrandId);
			if (input.search.productCategoryId)
				match.productCategoryId = shapeIntoMongoObjectId(input.search.productCategoryId);
		}

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return {
			products: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! REMOVE PRODUCT BY ADMIN
	public async removeProductByAdmin(productId: ObjectId): Promise<Product> {
		const result = await this.productModel
			.findByIdAndUpdate(productId, { productStatus: ProductStatus.DELETED }, { new: true })
			.exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	// ! PRODUCT STATS EDITS (internal)
	public async productStatsEdits(input: StatisticModifier): Promise<Product> {
		const { _id, targetKey, modifier } = input;
		return await this.productModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}
}
