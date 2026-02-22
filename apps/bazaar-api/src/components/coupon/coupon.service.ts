import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CouponStatus } from '../../libs/enums/coupons.enum';
import { CouponInput, CouponsInquiry } from '../../libs/dto/coupons/coupon.input';
import { Coupon, Coupons } from '../../libs/dto/coupons/coupon';
import { CouponUpdate } from '../../libs/dto/coupons/coupon.update';
import { T } from '../../libs/types/common';

@Injectable()
export class CouponService {
	constructor(@InjectModel('Coupon') private readonly couponModel: Model<Coupon>) {}

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
		const { couponStatus, text } = input.search ?? {};
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (couponStatus) match.couponStatus = couponStatus;
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

	public async checkCoupon(couponCode: string): Promise<Coupon> {
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

		// If usage limit is set, check it has not been exceeded
		if (coupon.couponMaxUsage !== undefined && coupon.couponUsageCount >= coupon.couponMaxUsage) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		return coupon;
	}
}
