import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CouponStatus, CouponType, DiscountType } from '../../libs/enums/coupons.enum';
import { BrandCouponInput, CouponInput, CouponsInquiry } from '../../libs/dto/coupons/coupon.input';
import { Coupon, Coupons } from '../../libs/dto/coupons/coupon';
import { CouponUpdate } from '../../libs/dto/coupons/coupon.update';
import { Member } from '../../libs/dto/member/member';
import { OrderItem } from '../../libs/dto/order-items/order-item';
import { Product } from '../../libs/dto/product/product';
import { T } from '../../libs/types/common';

@Injectable()
export class CouponService {
	constructor(
		@InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
	) {}

	/** ADMIN */

	public async createCouponByAdmin(input: CouponInput): Promise<Coupon> {
		try {
			const result = await this.couponModel.create(input);
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
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

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async removeCouponByAdmin(couponId: ObjectId): Promise<Coupon> {
		const result = await this.couponModel.findByIdAndDelete(couponId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	/** BRAND */

	public async createBrandCoupon(brandId: ObjectId, input: BrandCouponInput): Promise<Coupon> {
		try {
			const result = await this.couponModel.create({
				...input,
				couponType: CouponType.BRAND,
				brandId,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	/** USER */

	/**
	 * claimCoupon — user calls this to earn a coupon.
	 * - For brand coupons with minOrderCount: validates member has placed enough orders with this brand.
	 * - For platform/promo coupons: just validates active + dates + usage limit.
	 * - Member can only hold ONE coupon at a time.
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

		// Check global usage limit
		if (coupon.couponMaxUsage !== undefined && coupon.couponUsageCount >= coupon.couponMaxUsage) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const member = await this.memberModel.findById(memberId).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);

		// Member can only hold one coupon at a time
		if (member.memberCouponId) throw new BadRequestException(Message.BAD_REQUEST);

		// Brand milestone check
		if (coupon.couponType === CouponType.BRAND && coupon.minOrderCount) {
			const brandOrderCount = await this.countMemberOrdersWithBrand(memberId, coupon.brandId as ObjectId);
			if (brandOrderCount < coupon.minOrderCount) throw new BadRequestException(Message.BAD_REQUEST);
		}

		// Assign coupon to member
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
	}

	/**
	 * checkCoupon — at checkout: verifies member owns this coupon and it is unused.
	 * Returns the coupon so the frontend can show the discount.
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

		const member = await this.memberModel.findById(memberId).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);

		if (!member.memberCouponId || member.memberCouponId.toString() !== coupon._id.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (member.memberCouponStatus !== CouponStatus.ACTIVE) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		return coupon;
	}

	/**
	 * useCoupon — internal, called by OrderService after order is created.
	 * Marks the member's coupon as used and increments the coupon usage counter.
	 */
	public async useCoupon(memberId: ObjectId, couponCode: string): Promise<void> {
		const coupon = await this.couponModel.findOne({ couponCode }).exec();
		if (!coupon) return;

		await Promise.all([
			this.memberModel.findByIdAndUpdate(memberId, {
				memberCouponStatus: CouponStatus.EXPIRED,
				memberCouponUsedAt: new Date(),
			}),
			this.couponModel.findByIdAndUpdate(coupon._id, { $inc: { couponUsageCount: 1 } }),
		]);
	}

	/**
	 * applyWelcomeCoupon — internal, called by MemberService on USER signup.
	 * Looks up the WELCOME coupon and assigns it to the new member.
	 * Silently skips if no WELCOME coupon exists or limit exceeded.
	 */
	public async applyWelcomeCoupon(memberId: ObjectId): Promise<void> {
		const now = new Date();
		const coupon = await this.couponModel
			.findOne({
				couponCode: 'WELCOME',
				couponType: CouponType.PLATFORM,
				couponStatus: CouponStatus.ACTIVE,
				couponStartDate: { $lte: now },
				couponEndDate: { $gte: now },
			})
			.exec();

		if (!coupon) return;
		if (coupon.couponMaxUsage !== undefined && coupon.couponUsageCount >= coupon.couponMaxUsage) return;

		await this.memberModel.findByIdAndUpdate(memberId, {
			memberCouponId: coupon._id,
			memberCouponStatus: CouponStatus.ACTIVE,
			memberCouponAssignedAt: now,
		});
	}

	/** Count distinct orders that contain at least one product from the given brand */
	private async countMemberOrdersWithBrand(memberId: ObjectId, brandId: ObjectId): Promise<number> {
		// Find all productIds belonging to this brand
		const brandProducts = await this.productModel.find({ memberId: brandId }, { _id: 1 }).lean().exec();
		const brandProductIds = brandProducts.map((p) => p._id);

		if (!brandProductIds.length) return 0;

		// Count distinct orderId values in orderItems for this member's orders
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
				{ $match: { 'order.memberId': memberId } },
				{ $group: { _id: '$orderId' } },
				{ $count: 'total' },
			])
			.exec();

		return result[0]?.total ?? 0;
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
