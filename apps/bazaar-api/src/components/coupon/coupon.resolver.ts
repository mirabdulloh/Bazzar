import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CouponService } from './coupon.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Coupon, Coupons } from '../../libs/dto/coupons/coupon';
import { CouponClaimsData } from '../../libs/dto/coupons/coupon-claim';
import { Member } from '../../libs/dto/member/member';
import {
	BrandCouponInput,
	BrandCouponsInquiry,
	CouponInput,
	CouponsInquiry,
} from '../../libs/dto/coupons/coupon.input';
import { CouponClaimsInquiry } from '../../libs/dto/coupons/coupon-claim.input';
import { BrandCouponUpdate, CouponUpdate } from '../../libs/dto/coupons/coupon.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ObjectId } from 'mongoose';

@Resolver()
export class CouponResolver {
	constructor(private readonly couponService: CouponService) {}

	/** USER — validate coupon at checkout (must have claimed it first) */
	@UseGuards(AuthGuard)
	@Query(() => Coupon)
	public async checkCoupon(
		@Args('couponCode') couponCode: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Coupon> {
		return await this.couponService.checkCoupon(memberId, couponCode);
	}

	/** USER — claim a coupon (promo code or brand milestone) */
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async claimCoupon(
		@Args('couponCode') couponCode: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		return await this.couponService.claimCoupon(memberId, couponCode);
	}

	@UseGuards(AuthGuard)
	@Query(() => CouponClaimsData)
	public async getMyCouponClaims(
		@Args('input') input: CouponClaimsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<CouponClaimsData> {
		return await this.couponService.getMyCouponClaims(memberId, input);
	}

	/** BRAND — create a brand-scoped coupon */
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Coupon)
	public async createBrandCoupon(
		@Args('input') input: BrandCouponInput,
		@AuthMember('_id') brandId: ObjectId,
	): Promise<Coupon> {
		return await this.couponService.createBrandCoupon(brandId, input);
	}

	/** BRAND — update their own brand coupon (extend dates, usage, discount etc.) */
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Coupon)
	public async updateBrandCoupon(
		@Args('input') input: BrandCouponUpdate,
		@AuthMember('_id') brandId: ObjectId,
	): Promise<Coupon> {
		console.log('Mutation: updateBrandCoupon');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.couponService.updateBrandCoupon(brandId, input);
	}

	/** BRAND — list their own coupons */
	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Coupons)
	public async getBrandCoupons(
		@Args('input') input: BrandCouponsInquiry,
		@AuthMember('_id') brandId: ObjectId,
	): Promise<Coupons> {
		return await this.couponService.getBrandCoupons(brandId, input);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Coupon)
	public async createCouponByAdmin(@Args('input') input: CouponInput): Promise<Coupon> {
		return await this.couponService.createCouponByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Coupon)
	public async updateCouponByAdmin(@Args('input') input: CouponUpdate): Promise<Coupon> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.couponService.updateCouponByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Coupons)
	public async getAllCouponsByAdmin(@Args('input') input: CouponsInquiry): Promise<Coupons> {
		return await this.couponService.getAllCouponsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Coupon)
	public async removeCouponByAdmin(@Args('couponId') couponId: string): Promise<Coupon> {
		const id = shapeIntoMongoObjectId(couponId);
		return await this.couponService.removeCouponByAdmin(id);
	}
}
