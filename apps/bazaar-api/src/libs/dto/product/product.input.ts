import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus, ProductType } from '../../enums/products.enum';

@InputType()
export class ProductInput {
	@IsMongoId()
	@Field(() => String)
	memberId: string;

	@IsEnum(ProductType)
	@Field(() => ProductType)
	productType: ProductType;

	@IsMongoId()
	@Field(() => String)
	productBrandId: string;

	@IsMongoId()
	@Field(() => String)
	productCategoryId: string;

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
