import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ProductStatus, ProductType } from '../../enums/products.enum';

@InputType()
export class ProductUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsEnum(ProductType)
	@Field(() => ProductType, { nullable: true })
	productType?: ProductType;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productBrandId?: ObjectId;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	productCategoryId?: ObjectId;

	@IsOptional()
	@IsEnum(ProductStatus)
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productTitle?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productPrice?: number;

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

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	productImages?: string[];

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

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productSize?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productColor?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	productMaterials?: string;
}
