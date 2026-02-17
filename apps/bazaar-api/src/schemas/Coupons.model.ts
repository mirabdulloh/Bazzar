import { Schema } from 'mongoose';
import { CouponStatus, DiscountType } from '../libs/enums/coupons.enum';

const CouponSchema = new Schema(
	{
		couponCode: {
			type: String,
			required: true,
			unique: true, // coupon codes must be unique
		},

		discountType: {
			type: String,
			enum: DiscountType,
			default: DiscountType.PERCENTAGE,
		},

		discountValue: {
			type: Number,
			required: true,
		},

		couponMaxUsage: {
			type: Number,
		},
		couponUsageCount: {
			type: Number,
			default: 0,
		},
		couponStartDate: {
			type: Date,
			required: true,
		},

		couponEndDate: {
			type: Date,
			required: true,
		},

		couponStatus: {
			type: String,
			enum: CouponStatus,
			default: CouponStatus.ACTIVE,
		},
	},
	{ timestamps: true, collection: 'coupons' },
);

export default CouponSchema;
