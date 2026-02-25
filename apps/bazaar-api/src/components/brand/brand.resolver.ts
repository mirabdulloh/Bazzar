import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { Brand, BrandsData } from '../../libs/dto/brand/brand';
import { BrandsInquiry, AllBrandsInquiry } from '../../libs/dto/brand/brand.input';
import { BrandUpdate, BrandUpdateByAdmin } from '../../libs/dto/brand/brand.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BrandResolver {
	constructor(private readonly brandService: BrandService) {}

	// * MUTATIONS *

	// ! Update Brand Profile (Brand owner — only AFTER admin approval)
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Brand)
	public async updateBrand(@Args('input') input: BrandUpdate, @AuthMember('_id') memberId: ObjectId): Promise<Brand> {
		console.log('Mutation: updateBrand');
		return await this.brandService.updateBrand(memberId, input);
	}

	// * QUERIES *

	// ! Get My Brand (brand member sees their own brand, including PENDING status)
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Brand)
	public async getMyBrand(@AuthMember('_id') memberId: ObjectId): Promise<Brand> {
		console.log('Query: getMyBrand');
		return await this.brandService.getMyBrand(memberId);
	}

	// ! Get Single Brand (public — views tracked when logged in)
	@UseGuards(WithoutGuard)
	@Query(() => Brand)
	public async getBrand(
		@Args('brandId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Brand> {
		console.log('Query: getBrand');
		const brandId = shapeIntoMongoObjectId(input);
		return await this.brandService.getBrand(brandId, memberId);
	}

	// ! Get Brands (public paginated — ACTIVE only)
	@UseGuards(WithoutGuard)
	@Query(() => BrandsData)
	public async getBrands(@Args('input') input: BrandsInquiry): Promise<BrandsData> {
		console.log('Query: getBrands');
		return await this.brandService.getBrands(input);
	}

	// ! Get All Brands By Admin (all statuses including PENDING)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => BrandsData)
	public async getAllBrandsByAdmin(@Args('input') input: AllBrandsInquiry): Promise<BrandsData> {
		console.log('Query: getAllBrandsByAdmin');
		return await this.brandService.getAllBrandsByAdmin(input);
	}

	// ! Update Brand By Admin (approve PENDING → ACTIVE, or suspend)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Brand)
	public async updateBrandByAdmin(@Args('input') input: BrandUpdateByAdmin): Promise<Brand> {
		console.log('Mutation: updateBrandByAdmin');
		return await this.brandService.updateBrandByAdmin(input);
	}
}
