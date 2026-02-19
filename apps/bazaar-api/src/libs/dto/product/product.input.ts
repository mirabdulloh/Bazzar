import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	IsArray,
	IsEnum,
	IsIn,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { ProductStatus, ProductType } from '../../enums/products.enum';
import { availableProductSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ProductInput {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsEnum(ProductType)
	@Field(() => ProductType)
	productType: ProductType;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productCategoryId?: string;

	@IsOptional()
	@IsEnum(ProductStatus)
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	productTitle: string;

	@IsNumber()
	@Min(0)
	@Field(() => Float)
	productPrice: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productDiscountPrice?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productViews?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productLikes?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productComments?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productRank?: number;

	@IsArray()
	@IsString({ each: true })
	@Field(() => [String])
	productImages: string[];

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productRatingAverage?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productRatingCount?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productStockQuantity?: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	productSize: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	productColor: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productMaterials?: string;
}

// ! Search classes MUST be defined BEFORE inquiry classes that reference them

@InputType()
export class ProductsSearch {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productCategoryId?: string;

	@IsOptional()
	@IsEnum(ProductType, { each: true })
	@Field(() => [ProductType], { nullable: true })
	productTypeList?: ProductType[];

	@IsOptional()
	@IsEnum(ProductStatus)
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ProductsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ProductsSearch, { nullable: true })
	search?: ProductsSearch;
}

@InputType()
class BrandProductsSearch {
	@IsOptional()
	@IsEnum(ProductStatus)
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;
}

@InputType()
export class BrandProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => BrandProductsSearch)
	search: BrandProductsSearch;
}

@InputType()
class AllProductsSearch {
	@IsOptional()
	@IsEnum(ProductStatus)
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@IsEnum(ProductType, { each: true })
	@Field(() => [ProductType], { nullable: true })
	productTypeList?: ProductType[];

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productCategoryId?: string;
}

@InputType()
export class AllProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllProductsSearch)
	search: AllProductsSearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
