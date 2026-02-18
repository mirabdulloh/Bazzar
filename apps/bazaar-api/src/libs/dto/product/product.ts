import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProductStatus, ProductType } from '../../enums/products.enum';
import { Member, MetaData } from '../member/member';
import { MeLiked } from '../likes/like';

@ObjectType()
export class Product {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => ProductType)
	productType: ProductType;

	@Field(() => String)
	productBrandId: string;

	@Field(() => String)
	productCategoryId: string;

	@Field(() => ProductStatus)
	productStatus: ProductStatus;

	@Field(() => String)
	productTitle: string;

	@Field(() => Float)
	productPrice: number;

	@Field(() => Float)
	productDiscountPrice: number;

	@Field(() => Int)
	productViews: number;

	@Field(() => Int)
	productLikes: number;

	@Field(() => Int)
	productComments: number;

	@Field(() => Int)
	productRank: number;

	@Field(() => [String])
	productImages: string[];

	@Field(() => Float)
	productRatingAverage: number;

	@Field(() => Int)
	productRatingCount: number;

	@Field(() => Int)
	productStockQuantity: number;

	@Field(() => String, { nullable: true })
	productDesc?: string;

	@Field(() => String)
	productSize: string;

	@Field(() => String)
	productColor: string;

	@Field(() => String, { nullable: true })
	productMaterials?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class ProductsData {
	@Field(() => [Product])
	products: Product[];

	@Field(() => MetaData)
	metaData: MetaData;
}
