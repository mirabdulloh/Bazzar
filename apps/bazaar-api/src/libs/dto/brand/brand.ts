import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { BrandStatus } from '../../enums/brand.enum';
import { Member, MetaData } from '../member/member';

@ObjectType()
export class Brand {
	// Brand _id === Member _id (same ObjectId, no separate memberId field)
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	brandName: string;

	@Field(() => String, { nullable: true })
	brandLogo?: string;

	@Field(() => String, { nullable: true })
	brandDesc?: string;

	@Field(() => BrandStatus)
	brandStatus: BrandStatus;

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

	// ** Relationship Fields **
	// Lookup from members using Brand._id === Member._id
	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class BrandsData {
	@Field(() => [Brand])
	brands: Brand[];

	@Field(() => MetaData)
	metaData: MetaData;
}
