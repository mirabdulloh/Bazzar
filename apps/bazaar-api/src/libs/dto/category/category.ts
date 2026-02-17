import { Field, ObjectType } from '@nestjs/graphql';
import { CategoryStatus } from '../../enums/cattegory.enum';

@ObjectType()
export class Category {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	categoryName: string;

	@Field(() => String, { nullable: true })
	parentCategoryId?: string;

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
}
