import { Schema } from 'mongoose';
import { CouponClaimStatus } from '../libs/enums/coupons.enum';

const CouponClaimSchema = new Schema(
	{
		couponId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		brandId: {
			type: Schema.Types.ObjectId,
			index: true,
		},
		orderId: {
			type: Schema.Types.ObjectId,
			index: true,
		},
		claimStatus: {
			type: String,
			enum: CouponClaimStatus,
			default: CouponClaimStatus.CLAIMED,
			index: true,
		},
		claimedAt: {
			type: Date,
			default: Date.now,
		},
		usedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'couponClaims' },
);

CouponClaimSchema.index({ couponId: 1, memberId: 1 }, { unique: true });
CouponClaimSchema.index({ memberId: 1, claimStatus: 1, createdAt: -1 });

export default CouponClaimSchema;
