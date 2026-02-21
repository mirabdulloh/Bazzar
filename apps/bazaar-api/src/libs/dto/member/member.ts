import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CouponStatus } from '../../enums/coupons.enum';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked } from '../likes/like';

@ObjectType()
export class MetaCounter {
	@Field(() => Int)
	total: number;
}

@ObjectType()
export class MeFollowed {
	@Field(() => String)
	followerId: ObjectId;

	@Field(() => String)
	followingId: ObjectId;

	@Field(() => Boolean)
	myFollowing: boolean;
}

@ObjectType()
export class Member {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => MemberType)
	memberType: MemberType;

	@Field(() => MemberStatus)
	memberStatus: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType: MemberAuthType;

	@Field(() => String)
	memberPhone: string;

	@Field(() => String)
	memberNick: string;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@Field(() => String)
	memberImage: string;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberArticles: number;

	@Field(() => Int)
	memberFollowers: number;

	@Field(() => Int)
	memberFollowings: number;

	@Field(() => Int)
	memberPoints: number;

	@Field(() => Int)
	memberLikes: number;

	@Field(() => Int)
	memberViews: number;

	@Field(() => Int)
	memberComments: number;

	@Field(() => Int)
	memberRank: number;

	@Field(() => Int)
	memberWarnings: number;

	@Field(() => Int)
	memberProducts: number;

	@Field(() => Int)
	memberBlocks: number;

	@Field(() => String, { nullable: true })
	memberCouponId?: ObjectId;

	memberPassword?: string;

	@Field(() => CouponStatus)
	memberCouponStatus: CouponStatus;

	@Field(() => Date, { nullable: true })
	memberCouponUsedAt?: Date;

	@Field(() => Date, { nullable: true })
	memberCouponAssignedAt?: Date;

	@Field(() => Date, { nullable: true })
	lastLoginAt?: Date;

	@Field(() => Date, { nullable: true })
	lastActiveAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => String, { nullable: true })
	accessToken?: string;

	// ** Relationship Fields **
	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];
}

@ObjectType()
export class MetaData {
	@Field(() => Int)
	total: number;

	@Field(() => Int)
	page: number;

	@Field(() => Int)
	limit: number;
}

@ObjectType()
export class MembersData {
	@Field(() => [Member])
	members: Member[];

	@Field(() => MetaData)
	metaData: MetaData;
}
