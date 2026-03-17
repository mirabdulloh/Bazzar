import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { BrandStatus } from '../../enums/brand.enum';
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@ObjectType()
export class AdminDashboardPendingBrand {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	brandName: string;

	@Field(() => String, { nullable: true })
	brandLogo?: string;

	@Field(() => BrandStatus)
	brandStatus: BrandStatus;

	@Field(() => Date)
	createdAt: Date;
}

@ObjectType()
export class AdminDashboardLatestOrder {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String, { nullable: true })
	customerName?: string;

	@Field(() => String, { nullable: true })
	brandName?: string;

	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	@Field(() => OrderPaymentStatus)
	orderPaymentStatus: OrderPaymentStatus;

	@Field(() => OrderDeliveryStatus)
	orderDeliveryStatus: OrderDeliveryStatus;

	@Field(() => Float)
	orderFinalPrice: number;

	@Field(() => Date)
	createdAt: Date;
}

@ObjectType()
export class AdminDashboardStats {
	@Field(() => Int)
	totalBrands: number;

	@Field(() => Int)
	pendingBrands: number;

	@Field(() => Int)
	activeBrands: number;

	@Field(() => Int)
	inactiveBrands: number;

	@Field(() => Int)
	suspendedBrands: number;

	@Field(() => Int)
	totalMembers: number;

	@Field(() => Int)
	userMembers: number;

	@Field(() => Int)
	brandMembers: number;

	@Field(() => Int)
	adminMembers: number;

	@Field(() => Int)
	blockedMembers: number;

	@Field(() => Int)
	deletedMembers: number;

	@Field(() => Int)
	openOrders: number;

	@Field(() => Int)
	activePlatformCoupons: number;

	@Field(() => Int)
	totalArticles: number;

	@Field(() => Int)
	inactiveArticles: number;

	@Field(() => Int)
	totalReviews: number;

	@Field(() => Int)
	inactiveReviews: number;

	@Field(() => [AdminDashboardPendingBrand])
	pendingBrandQueue: AdminDashboardPendingBrand[];

	@Field(() => [AdminDashboardLatestOrder])
	latestOrders: AdminDashboardLatestOrder[];
}
