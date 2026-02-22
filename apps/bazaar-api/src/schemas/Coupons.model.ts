import { Schema } from 'mongoose';
import { CouponStatus, CouponType, DiscountType } from '../libs/enums/coupons.enum';

const CouponSchema = new Schema(
	{
		couponCode: {
			type: String,
			required: true,
			unique: true,
		},

		couponType: {
			type: String,
			enum: CouponType,
			default: CouponType.PLATFORM,
		},

		brandId: {
			type: Schema.Types.ObjectId, // set only for BRAND coupons
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

		minOrderCount: {
			type: Number, // brand loyalty milestone — how many orders with this brand required to claim
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

CouponSchema.index({ brandId: 1, couponStatus: 1 });
CouponSchema.index({ couponType: 1, couponStatus: 1 });

export default CouponSchema;
