import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category, CategoriesData } from '../../libs/dto/category/category';
import { AllCategoriesInquiry, CategoriesInquiry, CategoryInput } from '../../libs/dto/category/category.input';
import { CategoryUpdate } from '../../libs/dto/category/category.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class CategoryResolver {
	constructor(private readonly categoryService: CategoryService) {}
	// * PUBLIC QUERIES *

	// ! Get Categories (public — ACTIVE only, paginated with products)
	@Query(() => CategoriesData)
	public async getCategories(@Args('input') input: CategoriesInquiry): Promise<CategoriesData> {
		console.log('Query: getCategories');
		return await this.categoryService.getCategories(input);
	}

	// * ADMIN MUTATIONS *

	// ! Create Category
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Category)
	public async createCategory(@Args('input') input: CategoryInput): Promise<Category> {
		console.log('Mutation: createCategory');
		return await this.categoryService.createCategory(input);
	}

	// ! Update Category
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Category)
	public async updateCategory(@Args('input') input: CategoryUpdate): Promise<Category> {
		console.log('Mutation: updateCategory');
		return await this.categoryService.updateCategory(input);
	}

	// ! Delete Category (soft delete)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Category)
	public async deleteCategory(@Args('categoryId') input: string): Promise<Category> {
		console.log('Mutation: deleteCategory');
		const categoryId = shapeIntoMongoObjectId(input);
		return await this.categoryService.deleteCategory(categoryId);
	}

	// ! Get All Categories By Admin (paginated + search)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => CategoriesData)
	public async getAllCategoriesByAdmin(@Args('input') input: AllCategoriesInquiry): Promise<CategoriesData> {
		console.log('Query: getAllCategoriesByAdmin');
		return await this.categoryService.getAllCategoriesByAdmin(input);
	}
}
