import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	AdminDashboardLatestOrder,
	AdminDashboardPendingBrand,
	AdminDashboardStats,
} from '../../libs/dto/admin/dashboard';
import { ArticleStatus } from '../../libs/enums/articles.enum';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { CouponStatus, CouponType } from '../../libs/enums/coupons.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { ReviewStatus } from '../../libs/enums/review.enum';

@Injectable()
export class AdminDashboardService {
	constructor(
		@InjectModel('Brand') private readonly brandModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Order') private readonly orderModel: Model<any>,
		@InjectModel('Coupon') private readonly couponModel: Model<any>,
		@InjectModel('BoardArticle') private readonly articleModel: Model<any>,
		@InjectModel('Review') private readonly reviewModel: Model<any>,
	) {}

	public async getAdminDashboardStats(): Promise<AdminDashboardStats> {
		const [
			totalBrands,
			pendingBrands,
			activeBrands,
			inactiveBrands,
			suspendedBrands,
			totalMembers,
			userMembers,
			brandMembers,
			adminMembers,
			blockedMembers,
			deletedMembers,
			openOrders,
			activePlatformCoupons,
			totalArticles,
			inactiveArticles,
			totalReviews,
			inactiveReviews,
			pendingBrandQueue,
			latestOrders,
		] = await Promise.all([
			this.brandModel.countDocuments({}).exec(),
			this.brandModel.countDocuments({ brandStatus: BrandStatus.PENDING }).exec(),
			this.brandModel.countDocuments({ brandStatus: BrandStatus.ACTIVE }).exec(),
			this.brandModel.countDocuments({ brandStatus: BrandStatus.INACTIVE }).exec(),
			this.brandModel.countDocuments({ brandStatus: BrandStatus.SUSPENDED }).exec(),
			this.memberModel.countDocuments({}).exec(),
			this.memberModel.countDocuments({ memberType: MemberType.USER }).exec(),
			this.memberModel.countDocuments({ memberType: MemberType.BRAND }).exec(),
			this.memberModel.countDocuments({ memberType: MemberType.ADMIN }).exec(),
			this.memberModel.countDocuments({ memberStatus: MemberStatus.BLOCK }).exec(),
			this.memberModel.countDocuments({ memberStatus: MemberStatus.DELETE }).exec(),
			this.orderModel
				.countDocuments({ orderStatus: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED] } })
				.exec(),
			this.couponModel.countDocuments({ couponType: CouponType.PLATFORM, couponStatus: CouponStatus.ACTIVE }).exec(),
			this.articleModel.countDocuments({}).exec(),
			this.articleModel.countDocuments({ articleStatus: ArticleStatus.INACTIVE }).exec(),
			this.reviewModel.countDocuments({}).exec(),
			this.reviewModel.countDocuments({ reviewStatus: ReviewStatus.INACTIVE }).exec(),
			this.getPendingBrandQueue(),
			this.getLatestOrders(),
		]);

		return {
			totalBrands,
			pendingBrands,
			activeBrands,
			inactiveBrands,
			suspendedBrands,
			totalMembers,
			userMembers,
			brandMembers,
			adminMembers,
			blockedMembers,
			deletedMembers,
			openOrders,
			activePlatformCoupons,
			totalArticles,
			inactiveArticles,
			totalReviews,
			inactiveReviews,
			pendingBrandQueue,
			latestOrders,
		};
	}

	private async getPendingBrandQueue(): Promise<AdminDashboardPendingBrand[]> {
		return this.brandModel
			.find({ brandStatus: BrandStatus.PENDING })
			.sort({ createdAt: 1 })
			.limit(5)
			.select('_id brandName brandLogo brandStatus createdAt')
			.lean<AdminDashboardPendingBrand[]>()
			.exec();
	}

	private async getLatestOrders(): Promise<AdminDashboardLatestOrder[]> {
		return this.orderModel
			.aggregate([
				{ $sort: { createdAt: -1 } },
				{ $limit: 6 },
				{
					$lookup: {
						from: 'members',
						localField: 'memberId',
						foreignField: '_id',
						as: 'memberData',
					},
				},
				{
					$lookup: {
						from: 'brands',
						localField: 'brandId',
						foreignField: '_id',
						as: 'brandData',
					},
				},
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
				{ $unwind: { path: '$brandData', preserveNullAndEmptyArrays: true } },
				{
					$project: {
						_id: 1,
						orderStatus: 1,
						orderPaymentStatus: 1,
						orderDeliveryStatus: 1,
						orderFinalPrice: 1,
						createdAt: 1,
						customerName: { $ifNull: ['$memberData.memberNick', 'Unknown Member'] },
						brandName: { $ifNull: ['$brandData.brandName', 'Unknown Brand'] },
					},
				},
			])
			.exec();
	}
}
