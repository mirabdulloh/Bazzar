import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { MemberStatus, MemberType } from 'apps/bazaar-api/src/libs/enums/member.enum';
import { ProductStatus } from 'apps/bazaar-api/src/libs/enums/products.enum';
import { CouponStatus } from 'apps/bazaar-api/src/libs/enums/coupons.enum';
import { NotificationStatus } from 'apps/bazaar-api/src/libs/enums/notification.enum';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Coupon') private readonly couponModel: Model<any>,
		@InjectModel('Notification') private readonly notificationModel: Model<any>,
	) {}

	public async batchRollBack(): Promise<void> {
		console.log('Executing batchRollBack...');
		await Promise.all([
			this.productModel.updateMany({ productStatus: ProductStatus.ACTIVE }, { productRank: 0 }),
			this.memberModel.updateMany(
				{ memberStatus: MemberStatus.ACTIVE, memberType: MemberType.BRAND },
				{ memberRank: 0 },
			),
		]);
	}

	public async batchTopProducts(): Promise<void> {
		console.log('Executing batchTopProducts...');
		const products = await this.productModel
			.find({ productStatus: ProductStatus.ACTIVE, productRank: 0 })
			.lean()
			.exec();

		if (!products.length) return;

		await this.productModel.bulkWrite(
			products.map((p) => ({
				updateOne: {
					filter: { _id: p._id },
					update: { $set: { productRank: p.productLikes * 2 + p.productViews * 1 } },
				},
			})),
		);
	}

	public async batchTopBrands(): Promise<void> {
		console.log('Executing batchTopBrands...');
		const brands = await this.memberModel
			.find({ memberStatus: MemberStatus.ACTIVE, memberType: MemberType.BRAND, memberRank: 0 })
			.lean()
			.exec();

		if (!brands.length) return;

		await this.memberModel.bulkWrite(
			brands.map((b) => ({
				updateOne: {
					filter: { _id: b._id },
					update: {
						$set: {
							memberRank: b.memberProducts * 5 + b.memberLikes * 2 + b.memberFollowers * 3 + b.memberViews * 1,
						},
					},
				},
			})),
		);
	}

	// ! Expire overdue coupons — daily at 02:00
	@Cron('0 2 * * *')
	public async batchExpireCoupons(): Promise<void> {
		console.log('Executing batchExpireCoupons...');
		await this.couponModel.updateMany(
			{ couponStatus: CouponStatus.ACTIVE, couponEndDate: { $lt: new Date() } },
			{ couponStatus: CouponStatus.EXPIRED },
		);
	}

	// ! Clean old READ/ARCHIVED notifications (>30 days) — weekly Sunday 03:00
	@Cron('0 3 * * 0')
	public async batchCleanNotifications(): Promise<void> {
		console.log('Executing batchCleanNotifications...');
		const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		await this.notificationModel.deleteMany({
			notificationStatus: { $in: [NotificationStatus.READ, NotificationStatus.ARCHIVED] },
			createdAt: { $lt: cutoff },
		});
	}

	// ! Hard-delete soft-deleted members older than 90 days — weekly Sunday 04:00
	@Cron('0 4 * * 0')
	public async batchPurgeSoftDeleted(): Promise<void> {
		console.log('Executing batchPurgeSoftDeleted...');
		const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
		await this.memberModel.deleteMany({
			memberStatus: MemberStatus.DELETE,
			deletedAt: { $lt: cutoff },
		});
	}

	getHello(): string {
		return 'Welcome to Bazaar Batch Server!';
	}
}
