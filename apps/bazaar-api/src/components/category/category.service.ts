import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Category, CategoriesData } from '../../libs/dto/category/category';
import { AllCategoriesInquiry, CategoriesInquiry, CategoryInput } from '../../libs/dto/category/category.input';
import { CategoryUpdate } from '../../libs/dto/category/category.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { CategoryStatus } from '../../libs/enums/cattegory.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class CategoryService {
	private readonly logger = new Logger(CategoryService.name);

	constructor(@InjectModel('Category') private readonly categoryModel: Model<Category>) {}

	private categoryCache: Category[] | null = null;
	private cacheExpiry = 0;
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	private invalidateCache(): void {
		this.categoryCache = null;
	}

	// ! CREATE CATEGORY (Admin only)
	public async createCategory(input: CategoryInput): Promise<Category> {
		try {
			if (input.parentCategoryId) {
				// Validate parent exists and is active
				const parent = await this.categoryModel
					.findOne({ _id: shapeIntoMongoObjectId(input.parentCategoryId), categoryStatus: CategoryStatus.ACTIVE })
					.exec();
				if (!parent) throw new NotFoundException('Parent category not found or inactive');
			}
			const result = await this.categoryModel.create(input);
			this.invalidateCache();
			return result;
		} catch (err) {
			this.logger.error('createCategory failed:', err.message);
			if (err?.code === 11000) throw new BadRequestException('Category name already exists under this parent');
			throw err instanceof NotFoundException ? err : new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET CATEGORIES (public — ACTIVE only, paginated, with products per category)
	public async getCategories(input: CategoriesInquiry): Promise<CategoriesData> {
		const match: T = { categoryStatus: CategoryStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.text) match.categoryName = { $regex: new RegExp(input.text, 'i') };
		if (input.parentCategoryId) match.parentCategoryId = input.parentCategoryId;

		const result = await this.categoryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'products',
									let: { categoryId: '$_id' },
									pipeline: [
										{
											$match: {
												$expr: {
													$and: [
														{ $eq: ['$productCategoryId', '$$categoryId'] },
														{ $eq: ['$productStatus', 'ACTIVE'] },
													],
												},
											},
										},
										{ $sort: { productRank: -1 } },
										{ $limit: 8 },
									],
									as: 'products',
								},
							},
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE CATEGORY (Admin only)
	public async updateCategory(input: CategoryUpdate): Promise<Category> {
		const categoryId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const result = await this.categoryModel.findByIdAndUpdate(categoryId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		this.invalidateCache();
		return result;
	}

	// ! DELETE CATEGORY (Admin only — soft delete: set INACTIVE + deletedAt)
	public async deleteCategory(categoryId: ObjectId): Promise<Category> {
		const result = await this.categoryModel
			.findByIdAndUpdate(categoryId, { categoryStatus: CategoryStatus.INACTIVE, deletedAt: new Date() }, { new: true })
			.exec();

		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);
		this.invalidateCache();
		return result;
	}

	// ! GET ALL CATEGORIES BY ADMIN (paginated + search filters)
	public async getAllCategoriesByAdmin(input: AllCategoriesInquiry): Promise<CategoriesData> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.categoryStatus) match.categoryStatus = input.search.categoryStatus;
		if (input.search?.parentCategoryId) match.parentCategoryId = input.search.parentCategoryId;
		if (input.search?.text) match.categoryName = { $regex: new RegExp(input.search.text, 'i') };

		const result = await this.categoryModel
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

		return {
			list: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}
}
