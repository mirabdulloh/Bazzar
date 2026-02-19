import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Category } from '../../libs/dto/category/category';
import { CategoryInput } from '../../libs/dto/category/category.input';
import { CategoryUpdate } from '../../libs/dto/category/category.update';
import { Message } from '../../libs/enums/common.enum';
import { CategoryStatus } from '../../libs/enums/cattegory.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class CategoryService {
	constructor(@InjectModel('Category') private readonly categoryModel: Model<Category>) {}

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
			return await this.categoryModel.create(input);
		} catch (err) {
			console.log('Error on createCategory Service', err.message);
			if (err?.code === 11000) throw new BadRequestException('Category name already exists under this parent');
			throw err instanceof NotFoundException ? err : new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET CATEGORIES (public — all ACTIVE, flat list; frontend builds hierarchy from parentCategoryId)
	public async getCategories(): Promise<Category[]> {
		return await this.categoryModel
			.find({ categoryStatus: CategoryStatus.ACTIVE })
			.sort({ parentCategoryId: 1, categoryName: 1 })
			.lean()
			.exec();
	}

	// ! UPDATE CATEGORY (Admin only)
	public async updateCategory(input: CategoryUpdate): Promise<Category> {
		const categoryId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const result = await this.categoryModel.findByIdAndUpdate(categoryId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		return result;
	}

	// ! DELETE CATEGORY (Admin only — soft delete: set INACTIVE + deletedAt)
	public async deleteCategory(categoryId: ObjectId): Promise<Category> {
		const result = await this.categoryModel
			.findByIdAndUpdate(
				categoryId,
				{ categoryStatus: CategoryStatus.INACTIVE, deletedAt: new Date() },
				{ new: true },
			)
			.exec();

		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result;
	}

	// ! GET ALL CATEGORIES BY ADMIN (including inactive)
	public async getAllCategoriesByAdmin(): Promise<Category[]> {
		return await this.categoryModel.find().sort({ parentCategoryId: 1, categoryName: 1 }).lean().exec();
	}
}
