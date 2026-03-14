import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreatedOrdersPayload, Order, OrdersData } from '../../libs/dto/order/order';
import {
	CreateOrderInput,
	AllOrdersInquiry,
	MyOrdersInquiry,
	BrandOrdersInquiry,
} from '../../libs/dto/order/order.input';
import { BrandOrderUpdate, OrderUpdate } from '../../libs/dto/order/order.update';
import { OrderItem } from '../../libs/dto/order-items/order-item';
import { Product } from '../../libs/dto/product/product';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/products.enum';
import { CouponType } from '../../libs/enums/coupons.enum';
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from '../../libs/enums/order.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';
import { MemberService } from '../member/member.service';
import { CouponService } from '../coupon/coupon.service';
import { Coupon } from '../../libs/dto/coupons/coupon';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { MailService } from '../mail/mail.service';

type PreparedOrderItem = {
	productId: ObjectId;
	brandId: ObjectId;
	priceAtPurchase: number;
	itemQuantity: number;
	subtotal: number;
	selectedSize?: string;
	selectedColor?: string;
};

type BrandOrderGroup = {
	brandId: ObjectId;
	orderTotalPrice: number;
	items: PreparedOrderItem[];
};

@Injectable()
export class OrderService {
	private readonly logger = new Logger(OrderService.name);

	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		private readonly memberService: MemberService,
		private readonly couponService: CouponService,
		private readonly notificationService: NotificationService,
		private readonly mailService: MailService,
	) {}

	// ! CREATE ORDER
	public async createOrder(memberId: ObjectId, input: CreateOrderInput): Promise<CreatedOrdersPayload> {
		const { orderDeliveryAddressId, orderPaymentMethod, items, couponCode } = input;

		if (!items.length) throw new BadRequestException('Order must have at least one item');

		const normalizedItems = items.map((item) => ({
			...item,
			productId: shapeIntoMongoObjectId(item.productId),
			selectedSize: item.selectedSize?.trim() || undefined,
			selectedColor: item.selectedColor?.trim() || undefined,
		}));

		const productIds = normalizedItems.map((item) => item.productId);
		const products = await this.productModel
			.find({ _id: { $in: productIds }, productStatus: ProductStatus.ACTIVE })
			.lean()
			.exec();
		const productMap = new Map(products.map((product) => [product._id.toString(), product]));

		const groupedOrders = new Map<string, BrandOrderGroup>();
		let cartTotalPrice = 0;

		for (const item of normalizedItems) {
			const product = productMap.get(item.productId.toString());
			if (!product) throw new BadRequestException(`Product ${item.productId} not found or not active`);

			if ((product.productStockQuantity ?? 0) < item.itemQuantity) {
				throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
			}

			const brandId = shapeIntoMongoObjectId(product.memberId);
			const brandKey = brandId.toString();
			const priceAtPurchase = product.productDiscountPrice > 0 ? product.productDiscountPrice : product.productPrice;
			const subtotal = this.roundCurrency(priceAtPurchase * item.itemQuantity);

			cartTotalPrice += subtotal;

			const existingGroup = groupedOrders.get(brandKey) ?? {
				brandId,
				orderTotalPrice: 0,
				items: [],
			};

			existingGroup.orderTotalPrice = this.roundCurrency(existingGroup.orderTotalPrice + subtotal);
			existingGroup.items.push({
				productId: item.productId,
				brandId,
				priceAtPurchase,
				itemQuantity: item.itemQuantity,
				subtotal,
				selectedSize: item.selectedSize,
				selectedColor: item.selectedColor,
			});

			groupedOrders.set(brandKey, existingGroup);
		}

		let validatedCoupon: Coupon | null = null;
		let cartDiscountPrice = 0;
		const discountByBrand = new Map<string, number>();

		if (couponCode) {
			validatedCoupon = await this.couponService.checkCoupon(memberId, couponCode);

			if (validatedCoupon.couponType === CouponType.BRAND) {
				const couponBrandId = validatedCoupon.brandId?.toString();
				if (!couponBrandId || !groupedOrders.has(couponBrandId)) {
					throw new BadRequestException('Coupon is not applicable to the selected products');
				}

				const brandGroup = groupedOrders.get(couponBrandId)!;
				const brandDiscount = this.roundCurrency(
					this.couponService.calculateDiscount(validatedCoupon, brandGroup.orderTotalPrice),
				);
				discountByBrand.set(couponBrandId, brandDiscount);
				cartDiscountPrice = brandDiscount;
			} else {
				cartDiscountPrice = this.roundCurrency(this.couponService.calculateDiscount(validatedCoupon, cartTotalPrice));
				this.allocatePlatformDiscount(cartDiscountPrice, Array.from(groupedOrders.values())).forEach((value, key) => {
					discountByBrand.set(key, value);
				});
			}
		}

		const createdOrders: Order[] = [];
		const createdOrderIds: ObjectId[] = [];
		const decrementedStock: { productId: ObjectId; qty: number }[] = [];

		try {
			for (const [brandKey, group] of groupedOrders.entries()) {
				const orderDiscount = this.roundCurrency(discountByBrand.get(brandKey) ?? 0);
				const createdOrder = await this.orderModel.create({
					memberId,
					brandId: group.brandId,
					orderTotalPrice: group.orderTotalPrice,
					orderTotalDiscountPrice: orderDiscount,
					orderFinalPrice: this.roundCurrency(Math.max(group.orderTotalPrice - orderDiscount, 0)),
					orderDeliveryAddressId: shapeIntoMongoObjectId(orderDeliveryAddressId),
					...(orderPaymentMethod ? { orderPaymentMethod } : {}),
				});

				createdOrders.push(createdOrder);
				createdOrderIds.push(createdOrder._id as unknown as ObjectId);

				await this.orderItemModel.insertMany(
					group.items.map((item) => ({
						orderId: createdOrder._id,
						productId: item.productId,
						priceAtPurchase: item.priceAtPurchase,
						itemQuantity: item.itemQuantity,
						subtotal: item.subtotal,
						selectedSize: item.selectedSize,
						selectedColor: item.selectedColor,
					})),
				);
			}

			for (const group of groupedOrders.values()) {
				for (const item of group.items) {
					const updated = await this.productModel
						.findOneAndUpdate(
							{ _id: item.productId, productStockQuantity: { $gte: item.itemQuantity } },
							{ $inc: { productStockQuantity: -item.itemQuantity } },
						)
						.exec();

					if (!updated) {
						throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
					}

					decrementedStock.push({ productId: item.productId, qty: item.itemQuantity });
				}
			}

			if (validatedCoupon?._id) {
				await this.couponService.useCoupon(memberId, validatedCoupon._id as unknown as ObjectId);
			}

			await this.memberService.memberStatsEdits({
				_id: memberId,
				targetKey: 'memberPoints',
				modifier: Math.floor(cartTotalPrice * 0.01),
			});

			const member = await this.memberService.getMemberById(memberId);
			await Promise.allSettled(
				createdOrders.map(async (order) => {
					const message = `Your order of $${order.orderFinalPrice.toFixed(2)} has been placed successfully`;
					await this.notificationService.createNotification({
						authorId: memberId,
						receiverId: memberId,
						notificationType: NotificationType.ORDER,
						notificationGroup: NotificationGroup.ORDER,
						targetId: order._id as unknown as ObjectId,
						notificationTitle: 'Order Confirmed',
						notificationContent: message,
					});

					if (member?.memberEmail) {
						await this.mailService.sendOrderConfirmedEmail(
							member.memberEmail,
							order._id.toString(),
							order.orderFinalPrice,
						);
					}
				}),
			);

			return { orders: createdOrders };
		} catch (err) {
			if (decrementedStock.length) {
				await this.productModel.bulkWrite(
					decrementedStock.map((item) => ({
						updateOne: {
							filter: { _id: item.productId },
							update: { $inc: { productStockQuantity: item.qty } },
						},
					})),
				);
			}

			if (createdOrderIds.length) {
				await this.orderItemModel.deleteMany({ orderId: { $in: createdOrderIds } }).exec();
				await this.orderModel.deleteMany({ _id: { $in: createdOrderIds } }).exec();
			}

			this.logger.error('createOrder failed:', err.message);
			throw err instanceof BadRequestException ? err : new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET SINGLE ORDER (with items, member, brand, address lookups)
	public async getOrder(memberId: ObjectId, orderId: ObjectId): Promise<Order> {
		const result = await this.orderModel
			.aggregate([
				{ $match: { _id: orderId, memberId } },
				...this.buildOrderAggregationStages({ includeMember: true, includeBrand: true, includeAddress: true }),
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	// ! GET MY ORDERS (paginated)
	public async getMyOrders(memberId: ObjectId, input: MyOrdersInquiry): Promise<OrdersData> {
		const match: T = { memberId };

		if (input.search?.orderStatus) match.orderStatus = input.search.orderStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...this.buildOrderAggregationStages({ includeBrand: true, includeAddress: true }),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			orders: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE ORDER BY ADMIN
	public async updateOrderByAdmin(input: OrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongoObjectId(input._id);
		const existingOrder = await this.orderModel.findById(orderId).exec();
		if (!existingOrder) throw new NotFoundException(Message.NO_DATA_FOUND);

		const { _id, ...payload } = input;
		void _id;

		const updated = await this.orderModel.findByIdAndUpdate(orderId, payload, { new: true }).exec();
		if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (existingOrder.orderStatus !== OrderStatus.CANCELLED && input.orderStatus === OrderStatus.CANCELLED) {
			await this.restoreStockForOrder(orderId);
		}

		if (input.orderStatus) {
			await this.notifyOrderStatusChange(updated, input.orderStatus, 'Order Update');
		}

		return updated;
	}

	// ! GET ALL ORDERS BY ADMIN (paginated)
	public async getAllOrdersByAdmin(input: AllOrdersInquiry): Promise<OrdersData> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.orderStatus) match.orderStatus = input.search.orderStatus;
		if (input.search?.orderPaymentStatus) match.orderPaymentStatus = input.search.orderPaymentStatus;
		if (input.search?.memberId) match.memberId = shapeIntoMongoObjectId(input.search.memberId);

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...this.buildOrderAggregationStages({ includeMember: true, includeBrand: true, includeAddress: true }),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			orders: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! GET BRAND ORDERS
	public async getBrandOrders(brandId: ObjectId, input: BrandOrdersInquiry): Promise<OrdersData> {
		const match: T = { brandId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.orderStatus) match.orderStatus = input.search.orderStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...this.buildOrderAggregationStages({ includeMember: true, includeAddress: true }),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			orders: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! Cancel Order (user-initiated — PENDING orders only)
	public async cancelOrder(memberId: ObjectId, orderId: ObjectId): Promise<Order> {
		const order = await this.orderModel.findOne({ _id: orderId, memberId, orderStatus: OrderStatus.PENDING }).exec();
		if (!order) throw new BadRequestException('Order not found or cannot be cancelled');

		const updated = await this.orderModel
			.findOneAndUpdate({ _id: orderId }, { orderStatus: OrderStatus.CANCELLED }, { new: true })
			.exec();
		if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.restoreStockForOrder(orderId);
		await this.notifyOrderStatusChange(updated, OrderStatus.CANCELLED, 'Order Cancelled');

		return updated;
	}

	// ! UPDATE ORDER BY BRAND
	public async updateOrderByBrand(brandId: ObjectId, input: BrandOrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongoObjectId(input._id);
		const order = await this.orderModel.findOne({ _id: orderId, brandId }).exec();
		if (!order) throw new NotFoundException(Message.NO_DATA_FOUND);

		let update: T;
		let notificationTitle = 'Order Update';

		if (input.orderStatus === OrderStatus.CONFIRMED) {
			if (order.orderStatus !== OrderStatus.PENDING) {
				throw new BadRequestException('Only pending orders can be confirmed');
			}
			update = {
				orderStatus: OrderStatus.CONFIRMED,
				orderPaymentStatus: OrderPaymentStatus.PAID,
				orderDeliveryStatus: OrderDeliveryStatus.PREPARING,
			};
			notificationTitle = 'Order Confirmed';
		} else if (input.orderStatus === OrderStatus.CANCELLED) {
			if (order.orderStatus !== OrderStatus.PENDING) {
				throw new BadRequestException('Only pending orders can be cancelled by brand');
			}
			update = { orderStatus: OrderStatus.CANCELLED };
			notificationTitle = 'Order Cancelled';
		} else if (input.orderStatus === OrderStatus.SHIPPED) {
			if (order.orderStatus !== OrderStatus.CONFIRMED) {
				throw new BadRequestException('Only confirmed orders can be marked as shipped');
			}
			update = {
				orderStatus: OrderStatus.SHIPPED,
				orderDeliveryStatus: OrderDeliveryStatus.SHIPPING,
			};
			notificationTitle = 'Order Shipped';
		} else {
			throw new BadRequestException('Invalid brand order transition');
		}

		const updated = await this.orderModel.findByIdAndUpdate(orderId, update, { new: true }).exec();
		if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (input.orderStatus === OrderStatus.CANCELLED) {
			await this.restoreStockForOrder(orderId);
		}

		await this.notifyOrderStatusChange(updated, input.orderStatus, notificationTitle, brandId);
		return updated;
	}

	// ! CUSTOMER CONFIRMS DELIVERY
	public async confirmOrderReceived(memberId: ObjectId, orderId: ObjectId): Promise<Order> {
		const order = await this.orderModel.findOne({ _id: orderId, memberId, orderStatus: OrderStatus.SHIPPED }).exec();
		if (!order) throw new BadRequestException('Order not found or cannot be marked as delivered');

		const updated = await this.orderModel
			.findByIdAndUpdate(
				orderId,
				{
					orderStatus: OrderStatus.DELIVERED,
					orderDeliveryStatus: OrderDeliveryStatus.DELIVERED,
				},
				{ new: true },
			)
			.exec();
		if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.notifyOrderStatusChange(updated, OrderStatus.DELIVERED, 'Order Delivered', memberId);
		return updated;
	}

	private buildOrderAggregationStages(options: {
		includeMember?: boolean;
		includeBrand?: boolean;
		includeAddress?: boolean;
	}): any[] {
		const stages: any[] = [
			{
				$lookup: {
					from: 'orderItems',
					localField: '_id',
					foreignField: 'orderId',
					as: 'orderItems',
				},
			},
			{
				$lookup: {
					from: 'products',
					localField: 'orderItems.productId',
					foreignField: '_id',
					as: 'productDetails',
				},
			},
			{
				$addFields: {
					orderItems: {
						$map: {
							input: '$orderItems',
							as: 'item',
							in: {
								$mergeObjects: [
									'$$item',
									{
										product: {
											$arrayElemAt: [
												{
													$filter: {
														input: '$productDetails',
														as: 'prod',
														cond: { $eq: ['$$prod._id', '$$item.productId'] },
													},
												},
												0,
											],
										},
									},
								],
							},
						},
					},
				},
			},
		];

		if (options.includeAddress) {
			stages.push(
				{
					$lookup: {
						from: 'addresses',
						localField: 'orderDeliveryAddressId',
						foreignField: '_id',
						as: 'deliveryAddress',
					},
				},
				{ $unwind: { path: '$deliveryAddress', preserveNullAndEmptyArrays: true } },
			);
		}

		if (options.includeMember) {
			stages.push(
				{
					$lookup: {
						from: 'members',
						localField: 'memberId',
						foreignField: '_id',
						as: 'member',
					},
				},
				{ $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
			);
		}

		if (options.includeBrand) {
			stages.push(
				{
					$lookup: {
						from: 'members',
						localField: 'brandId',
						foreignField: '_id',
						as: 'brand',
					},
				},
				{ $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
			);
		}

		stages.push({ $project: { productDetails: 0 } });
		return stages;
	}

	private allocatePlatformDiscount(totalDiscount: number, groups: BrandOrderGroup[]): Map<string, number> {
		const allocations = new Map<string, number>();
		if (!groups.length || totalDiscount <= 0) return allocations;

		const totalDiscountCents = Math.round(totalDiscount * 100);
		const cartTotalPrice = groups.reduce((sum, group) => sum + group.orderTotalPrice, 0);
		let allocatedCents = 0;

		groups.forEach((group, index) => {
			let cents =
				index === groups.length - 1
					? totalDiscountCents - allocatedCents
					: Math.round((group.orderTotalPrice / cartTotalPrice) * totalDiscountCents);

			cents = Math.min(cents, Math.round(group.orderTotalPrice * 100));
			allocatedCents += cents;
			allocations.set(group.brandId.toString(), cents / 100);
		});

		return allocations;
	}

	private async restoreStockForOrder(orderId: ObjectId): Promise<void> {
		const orderItems = await this.orderItemModel.find({ orderId }).lean().exec();
		if (!orderItems.length) return;

		await this.productModel.bulkWrite(
			orderItems.map((item) => ({
				updateOne: {
					filter: { _id: item.productId },
					update: { $inc: { productStockQuantity: item.itemQuantity } },
				},
			})),
		);
	}

	private async notifyOrderStatusChange(
		order: Order,
		status: OrderStatus,
		title: string,
		authorId?: ObjectId,
	): Promise<void> {
		const contentMap: Record<OrderStatus, string> = {
			[OrderStatus.PENDING]: 'Your order is pending review',
			[OrderStatus.CONFIRMED]: 'Your order has been confirmed',
			[OrderStatus.SHIPPED]: 'Your order is on its way',
			[OrderStatus.DELIVERED]: 'Your order has been delivered',
			[OrderStatus.CANCELLED]: 'Your order has been cancelled',
			[OrderStatus.REFUNDED]: 'Your order has been refunded',
		};

		try {
			await this.notificationService.createNotification({
				authorId: (authorId ?? (order.brandId as unknown as ObjectId)) as ObjectId,
				receiverId: order.memberId as unknown as ObjectId,
				notificationType: NotificationType.ORDER,
				notificationGroup: NotificationGroup.ORDER,
				targetId: order._id as unknown as ObjectId,
				notificationTitle: title,
				notificationContent: contentMap[status],
			});
		} catch (err) {
			this.logger.error(`Notification error (${status}):`, err.message);
		}

		try {
			const member = await this.memberService.getMemberById(order.memberId as unknown as ObjectId);
			if (member?.memberEmail) {
				await this.mailService.sendOrderStatusEmail(member.memberEmail, order._id.toString(), status);
			}
		} catch (err) {
			this.logger.error(`Mail error (${status}):`, err.message);
		}
	}

	private roundCurrency(value: number): number {
		return Math.round((value + Number.EPSILON) * 100) / 100;
	}
}
