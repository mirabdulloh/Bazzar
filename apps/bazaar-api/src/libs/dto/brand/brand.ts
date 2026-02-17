import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BrandStatus } from '../../enums/brand.enum';

@ObjectType()
export class Brand {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	brandName: string;

	@Field(() => String)
	brandLogo: string;

	@Field(() => String, { nullable: true })
	brandDesc?: string;

	@Field(() => BrandStatus)
	brandStatus: BrandStatus;

	@Field(() => String)
	memberId: string;

	@Field(() => Float)
	brandRating: number;

	@Field(() => Int)
	brandFollowersCount: number;

	@Field(() => Int)
	brandReviewsCount: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
