import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CouponClaimStatus, CouponStatus, CouponType, DiscountType } from '../../libs/enums/coupons.enum';
import {
	BrandCouponInput,
	BrandCouponsInquiry,
	CouponInput,
	CouponsInquiry,
} from '../../libs/dto/coupons/coupon.input';
import { Coupon, Coupons } from '../../libs/dto/coupons/coupon';
import { BrandCouponUpdate, CouponUpdate } from '../../libs/dto/coupons/coupon.update';
import { CouponClaim, CouponClaimsData } from '../../libs/dto/coupons/coupon-claim';
import { CouponClaimsInquiry } from '../../libs/dto/coupons/coupon-claim.input';
import { Member } from '../../libs/dto/member/member';
import { OrderItem } from '../../libs/dto/order-items/order-item';
import { Product } from '../../libs/dto/product/product';
import { T } from '../../libs/types/common';
import { OrderStatus } from '../../libs/enums/order.enum';

@Injectable()
export class CouponService {
	private readonly logger = new Logger(CouponService.name);

	constructor(
		@InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
		@InjectModel('CouponClaim') private readonly couponClaimModel: Model<CouponClaim>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
	) {}

	/** ADMIN */

	public async createCouponByAdmin(input: CouponInput): Promise<Coupon> {
		try {
			const result = await this.couponModel.create(input);
			return result;
		} catch (err: any) {
			this.logger.error('createCoupon failed:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateCouponByAdmin(input: CouponUpdate): Promise<Coupon> {
		const { _id } = input;
		const result = await this.couponModel.findOneAndUpdate({ _id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getAllCouponsByAdmin(input: CouponsInquiry): Promise<Coupons> {
		const { couponStatus, couponType, text } = input.search ?? {};
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (couponStatus) match.couponStatus = couponStatus;
		if (couponType) match.couponType = couponType;
		if (text) match.couponCode = { $regex: text, $options: 'i' };

		const result = await this.couponModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async removeCouponByAdmin(couponId: ObjectId): Promise<Coupon> {
		const result = await this.couponModel.findByIdAndDelete(couponId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	/** BRAND */

	public async updateBrandCoupon(brandId: ObjectId, input: BrandCouponUpdate): Promise<Coupon> {
		const { _id, ...update } = input;

		const result = await this.couponModel
			.findOneAndUpdate({ _id, brandId, couponType: CouponType.BRAND }, update, { new: true })
			.exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result;
	}

	public async createBrandCoupon(brandId: ObjectId, input: BrandCouponInput): Promise<Coupon> {
		try {
			const result = await this.couponModel.create({
				...input,
				couponType: CouponType.BRAND,
				brandId,
			});
			return result;
		} catch (err: any) {
			this.logger.error('createCoupon failed:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBrandCoupons(brandId: ObjectId, input: BrandCouponsInquiry): Promise<Coupons> {
		const { couponStatus } = input.search ?? {};
		const match: T = { brandId, couponType: CouponType.BRAND };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (couponStatus) match.couponStatus = couponStatus;

		const result = await this.couponModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** USER */

	public async getMyCouponClaims(memberId: ObjectId, input: CouponClaimsInquiry): Promise<CouponClaimsData> {
		const match: T = { memberId };
		const sort: T = { [input?.sort ?? 'claimedAt']: input?.direction ?? Direction.DESC };

		if (input.search?.claimStatus) match.claimStatus = input.search.claimStatus;

		const result = await this.couponClaimModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'coupons',
									localField: 'couponId',
									foreignField: '_id',
									as: 'coupon',
								},
							},
							{
								$unwind: {
									path: '$coupon',
									preserveNullAndEmptyArrays: true,
								},
							},
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	/**
	 * Claim flow:
	 * - validates coupon activity/date window
	 * - validates brand loyalty requirement using DELIVERED orders only
	 * - creates one claim per member per coupon
	 * - reserves claim capacity via couponUsageCount
	 * - keeps legacy member coupon fields synced temporarily for current UI
	 */
	public async claimCoupon(memberId: ObjectId, couponCode: string): Promise<Member> {
		const now = new Date();
		const coupon = await this.couponModel
			.findOne({
				couponCode,
				couponStatus: CouponStatus.ACTIVE,
				couponStartDate: { $lte: now },
				couponEndDate: { $gte: now },
			})
			.exec();
		if (!coupon) throw new BadRequestException(Message.NO_DATA_FOUND);

		const member = await this.memberModel.findById(memberId).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);

		const existingClaim = await this.couponClaimModel.findOne({ couponId: coupon._id, memberId }).lean().exec();
		if (existingClaim) {
			throw new BadRequestException(Message.COUPON_ALREADY_CLAIMED);
		}

		if (coupon.couponType === CouponType.BRAND && coupon.minOrderCount) {
			const brandOrderCount = await this.countMemberDeliveredOrdersWithBrand(memberId, coupon.brandId as ObjectId);
			if (brandOrderCount < coupon.minOrderCount) {
				throw new BadRequestException(Message.COUPON_NOT_ELIGIBLE);
			}
		}

		let createdClaim: CouponClaim | null = null;
		try {
			createdClaim = await this.couponClaimModel.create({
				couponId: coupon._id,
				memberId,
				brandId: coupon.couponType === CouponType.BRAND ? coupon.brandId : undefined,
				claimStatus: CouponClaimStatus.CLAIMED,
				claimedAt: now,
			});

			const reservedCoupon = await this.reserveCouponSlot(coupon._id as unknown as ObjectId);
			if (!reservedCoupon) {
				await this.couponClaimModel.findByIdAndDelete(createdClaim._id).exec();
				throw new BadRequestException(Message.COUPON_CLAIM_LIMIT_REACHED);
			}

			const result = await this.memberModel
				.findByIdAndUpdate(
					memberId,
					{
						memberCouponId: coupon._id,
						memberCouponStatus: CouponStatus.ACTIVE,
						memberCouponAssignedAt: now,
						memberCouponUsedAt: null,
					},
					{ new: true },
				)
				.exec();

			if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			return result;
		} catch (err: any) {
			if (err?.code === 11000) {
				throw new BadRequestException(Message.COUPON_ALREADY_CLAIMED);
			}
			throw err instanceof BadRequestException ? err : new BadRequestException(Message.CREATE_FAILED);
		}
	}

	/**
	 * Checkout validates one active claim for this member+coupon.
	 * Legacy member coupon fields are not used as the business source anymore.
	 */
	public async checkCoupon(memberId: ObjectId, couponCode: string): Promise<Coupon> {
		const now = new Date();
		const coupon = await this.couponModel
			.findOne({
				couponCode,
				couponStatus: CouponStatus.ACTIVE,
				couponStartDate: { $lte: now },
				couponEndDate: { $gte: now },
			})
			.exec();
		if (!coupon) throw new BadRequestException(Message.NO_DATA_FOUND);

		const claim = await this.couponClaimModel
			.findOne({
				couponId: coupon._id,
				memberId,
				claimStatus: CouponClaimStatus.CLAIMED,
			})
			.exec();

		if (!claim) {
			throw new BadRequestException(Message.COUPON_NOT_CLAIMED);
		}

		return coupon;
	}

	/**
	 * Called by OrderService after order creation succeeds.
	 * Marks one active claim as USED. couponUsageCount is already consumed at claim time.
	 */
	public async useCoupon(memberId: ObjectId, couponId: ObjectId): Promise<void> {
		const now = new Date();
		const claim = await this.couponClaimModel
			.findOneAndUpdate(
				{
					couponId,
					memberId,
					claimStatus: CouponClaimStatus.CLAIMED,
				},
				{
					claimStatus: CouponClaimStatus.USED,
					usedAt: now,
				},
				{ new: true },
			)
			.exec();

		if (!claim) {
			throw new BadRequestException(Message.COUPON_NOT_CLAIMED);
		}

		await this.syncLegacyMemberCoupon(memberId, couponId, now);
	}

	/** Count distinct delivered orders that contain at least one product from the given brand */
	private async countMemberDeliveredOrdersWithBrand(memberId: ObjectId, brandId: ObjectId): Promise<number> {
		const brandProducts = await this.productModel.find({ memberId: brandId }, { _id: 1 }).lean().exec();
		const brandProductIds = brandProducts.map((p) => p._id);

		if (!brandProductIds.length) return 0;

		const result = await this.orderItemModel
			.aggregate([
				{ $match: { productId: { $in: brandProductIds } } },
				{
					$lookup: {
						from: 'orders',
						localField: 'orderId',
						foreignField: '_id',
						as: 'order',
					},
				},
				{ $unwind: '$order' },
				{
					$match: {
						'order.memberId': memberId,
						'order.orderStatus': OrderStatus.DELIVERED,
					},
				},
				{ $group: { _id: '$orderId' } },
				{ $count: 'total' },
			])
			.exec();

		return result[0]?.total ?? 0;
	}

	private async reserveCouponSlot(couponId: ObjectId): Promise<Coupon | null> {
		const coupon = await this.couponModel.findById(couponId).lean().exec();
		if (!coupon) throw new BadRequestException(Message.NO_DATA_FOUND);

		if (coupon.couponMaxUsage === undefined) {
			return await this.couponModel
				.findByIdAndUpdate(couponId, { $inc: { couponUsageCount: 1 } }, { new: true })
				.exec();
		}

		return await this.couponModel
			.findOneAndUpdate(
				{
					_id: couponId,
					couponUsageCount: { $lt: coupon.couponMaxUsage },
				},
				{ $inc: { couponUsageCount: 1 } },
				{ new: true },
			)
			.exec();
	}

	private async syncLegacyMemberCoupon(memberId: ObjectId, usedCouponId: ObjectId, usedAt: Date): Promise<void> {
		const nextClaim = await this.couponClaimModel
			.findOne({
				memberId,
				claimStatus: CouponClaimStatus.CLAIMED,
			})
			.sort({ claimedAt: -1 })
			.exec();

		if (nextClaim) {
			await this.memberModel
				.findByIdAndUpdate(memberId, {
					memberCouponId: nextClaim.couponId,
					memberCouponStatus: CouponStatus.ACTIVE,
					memberCouponAssignedAt: nextClaim.claimedAt,
					memberCouponUsedAt: null,
				})
				.exec();
			return;
		}

		await this.memberModel
			.findByIdAndUpdate(memberId, {
				memberCouponId: usedCouponId,
				memberCouponStatus: CouponStatus.EXPIRED,
				memberCouponUsedAt: usedAt,
			})
			.exec();
	}

	/** Expose discount calculation helper for OrderService */
	public calculateDiscount(coupon: Coupon, orderTotalPrice: number): number {
		const raw =
			coupon.discountType === DiscountType.PERCENTAGE
				? orderTotalPrice * (coupon.discountValue / 100)
				: coupon.discountValue;
		return Math.min(raw, orderTotalPrice);
	}
}
