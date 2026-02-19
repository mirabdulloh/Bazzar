import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product, ProductsData } from '../../libs/dto/product/product';
import {
	ProductInput,
	ProductsInquiry,
	AllProductsInquiry,
	BrandProductsInquiry,
	OrdinaryInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';

@Resolver()
export class ProductsResolver {
	constructor(
		private readonly productsService: ProductsService,
		private readonly likeService: LikeService,
		private readonly viewService: ViewService,
	) {}

	// * MUTATIONS *

	// ! Create Product (Brand only)
	@Mutation(() => Product)
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	public async createProduct(
		@Args('input') input: ProductInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		console.log('Mutation: createProduct');
		input.memberId = memberId;
		return await this.productsService.createProduct(input);
	}

	// ! Update Product (Brand owner)
	@Mutation(() => Product)
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	public async updateProduct(
		@Args('input') input: ProductUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		console.log('Mutation: updateProduct');
		return await this.productsService.updateProduct(memberId, input);
	}

	// ! Like Target Product
	@UseGuards(AuthGuard)
	@Mutation(() => Product)
	public async likeTargetProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		console.log('Mutation: likeTargetProduct');
		const productId = shapeIntoMongoObjectId(input);
		return await this.productsService.likeTargetProduct(memberId, productId);
	}

	// * QUERIES *

	// ! Get Single Product (Public - optional auth)
	@UseGuards(WithoutGuard)
	@Query(() => Product)
	public async getProduct(@Args('productId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Product> {
		console.log('Query: getProduct');
		const productId = shapeIntoMongoObjectId(input);
		return await this.productsService.getProduct(memberId, productId);
	}

	// ! Get Products (Public - optional auth for meLiked)
	@UseGuards(WithoutGuard)
	@Query(() => ProductsData)
	public async getProducts(
		@Args('input') input: ProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ProductsData> {
		console.log('Query: getProducts');
		return await this.productsService.getProducts(memberId, input);
	}

	// ! Get Brand Products (Brand's own products)
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => ProductsData)
	public async getBrandProducts(
		@Args('input') input: BrandProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ProductsData> {
		console.log('Query: getBrandProducts');
		return await this.productsService.getBrandProducts(memberId, input);
	}

	// ! Get Favorite Products (Liked products)
	@UseGuards(AuthGuard)
	@Query(() => ProductsData)
	public async getFavoriteProducts(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ProductsData> {
		console.log('Query: getFavoriteProducts');
		return await this.likeService.getFavoriteProducts(memberId, input);
	}

	// ! Get Visited Products
	@UseGuards(AuthGuard)
	@Query(() => ProductsData)
	public async getVisitedProducts(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ProductsData> {
		console.log('Query: getVisitedProducts');
		return await this.viewService.getVisitedProducts(memberId, input);
	}

	// * ADMIN QUERIES *

	// ! Get All Products (Admin)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => ProductsData)
	public async getAllProductsByAdmin(@Args('input') input: AllProductsInquiry): Promise<ProductsData> {
		console.log('Query: getAllProductsByAdmin');
		return await this.productsService.getAllProductsByAdmin(input);
	}

	// ! Remove Product (Admin)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Product)
	public async removeProductByAdmin(@Args('productId') input: string): Promise<Product> {
		console.log('Mutation: removeProductByAdmin');
		const productId = shapeIntoMongoObjectId(input);
		return await this.productsService.removeProductByAdmin(productId);
	}
}
