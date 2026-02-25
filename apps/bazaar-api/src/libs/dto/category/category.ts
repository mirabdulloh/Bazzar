import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CategoryStatus } from '../../enums/cattegory.enum';
import { MetaData } from '../member/member';
import { Product } from '../product/product';

@ObjectType()
export class Category {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	categoryName: string;

	@Field(() => String, { nullable: true })
	parentCategoryId?: ObjectId;

	@Field(() => CategoryStatus)
	categoryStatus: CategoryStatus;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// ** Relationship Fields **
	@Field(() => Category, { nullable: true })
	parentCategory?: Category;

	@Field(() => [Category], { nullable: true })
	subCategories?: Category[];

	@Field(() => [Product], { nullable: true })
	products?: Product[];
}

@ObjectType()
export class CategoriesData {
	@Field(() => [Category])
	list: Category[];

	@Field(() => MetaData)
	metaData: MetaData;
}
