import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Order, OrdersData } from '../../libs/dto/order/order';
import { CreateOrderInput, AllOrdersInquiry, MyOrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderUpdate } from '../../libs/dto/order/order.update';
import { OrderItem } from '../../libs/dto/order-items/order-item';
import { Product } from '../../libs/dto/product/product';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/products.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';
import { MemberService } from '../member/member.service';
import { CouponService } from '../coupon/coupon.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { MailService } from '../mail/mail.service';

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
	public async createOrder(memberId: ObjectId, input: CreateOrderInput): Promise<Order> {
		const { orderDeliveryAddressId, orderPaymentMethod, items, couponCode } = input;

		if (!items.length) throw new BadRequestException('Order must have at least one item');

		// 1. Validate products and get current prices
		let orderTotalPrice = 0;
		const orderItemsData: { productId: ObjectId; priceAtPurchase: number; itemQuantity: number; subtotal: number }[] =
			[];

		const productIds = items.map((item) => shapeIntoMongoObjectId(item.productId));
		const products = await this.productModel
			.find({ _id: { $in: productIds }, productStatus: ProductStatus.ACTIVE })
			.lean()
			.exec();
		const productMap = new Map(products.map((p) => [p._id.toString(), p]));

		for (const item of items) {
			const product = productMap.get(item.productId.toString());
			if (!product) throw new BadRequestException(`Product ${item.productId} not found or not active`);
			if (product.productStockQuantity < item.itemQuantity) {
				throw new BadRequestException(
					`Insufficient stock for ${product.productTitle}. Available: ${product.productStockQuantity}`,
				);
			}

			const productId = shapeIntoMongoObjectId(item.productId);
			const priceAtPurchase = product.productDiscountPrice > 0 ? product.productDiscountPrice : product.productPrice;
			const subtotal = priceAtPurchase * item.itemQuantity;
			orderTotalPrice += subtotal;

			orderItemsData.push({
				productId,
				priceAtPurchase,
				itemQuantity: item.itemQuantity,
				subtotal,
			});
		}

		// 2. Apply coupon discount if provided
		let orderTotalDiscountPrice = 0;
		let orderFinalPrice = orderTotalPrice;
		let validatedCoupon = null;

		if (couponCode) {
			validatedCoupon = await this.couponService.checkCoupon(memberId, couponCode);
			orderTotalDiscountPrice = this.couponService.calculateDiscount(validatedCoupon, orderTotalPrice);
			orderFinalPrice = orderTotalPrice - orderTotalDiscountPrice;
		}

		try {
			// 3. Create the order
			const orderData: T = {
				memberId,
				orderTotalPrice,
				orderTotalDiscountPrice,
				orderFinalPrice,
				orderDeliveryAddressId: shapeIntoMongoObjectId(orderDeliveryAddressId),
			};
			if (orderPaymentMethod) orderData.orderPaymentMethod = orderPaymentMethod;

			const createdOrder = await this.orderModel.create(orderData);

			// 4. Create order items
			const orderItems = orderItemsData.map((itemData) => ({
				orderId: createdOrder._id,
				productId: itemData.productId,
				priceAtPurchase: itemData.priceAtPurchase,
				itemQuantity: itemData.itemQuantity,
				subtotal: itemData.subtotal,
			}));
			await this.orderItemModel.insertMany(orderItems);

			// 4. Decrement product stock (single bulkWrite)
			await this.productModel.bulkWrite(
				orderItemsData.map((itemData) => ({
					updateOne: {
						filter: { _id: itemData.productId },
						update: { $inc: { productStockQuantity: -itemData.itemQuantity } },
					},
				})),
			);

			// 5. Mark coupon as used if one was applied
			if (validatedCoupon) {
				await this.couponService.useCoupon(memberId, validatedCoupon._id as unknown as ObjectId);
			}

			// 6. Update member points (optional reward)
			await this.memberService.memberStatsEdits({
				_id: memberId,
				targetKey: 'memberPoints',
				modifier: Math.floor(orderTotalPrice * 0.01), // 1% points reward
			});

			// 7. Notify member — order confirmation
			this.notificationService
				.createNotification({
					authorId: memberId,
					receiverId: memberId,
					notificationType: NotificationType.ORDER,
					notificationGroup: NotificationGroup.ORDER,
					targetId: createdOrder._id as unknown as ObjectId,
					notificationTitle: 'Order Confirmed',
					notificationContent: `Your order of $${orderFinalPrice.toFixed(2)} has been placed successfully`,
				})
				.catch((err) => console.log('Notification error (order confirm):', err.message));

			// Email order confirmation
			this.memberService
				.getMember(null, memberId)
				.then((m) => {
					if (m?.memberEmail) {
						this.mailService
							.sendOrderConfirmedEmail(m.memberEmail, createdOrder._id.toString(), orderFinalPrice)
							.catch((err) => console.log('Mail error (order confirm):', err.message));
					}
				})
				.catch(() => {});

			return createdOrder;
		} catch (err) {
			console.log('Error on createOrder Service', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET SINGLE ORDER (with items, member, address lookups)
	public async getOrder(memberId: ObjectId, orderId: ObjectId): Promise<Order> {
		const result = await this.orderModel
			.aggregate([
				{ $match: { _id: orderId, memberId: memberId } },
				// Lookup order items
				{
					$lookup: {
						from: 'orderItems',
						localField: '_id',
						foreignField: 'orderId',
						as: 'orderItems',
					},
				},
				// Lookup product data for each order item
				{
					$lookup: {
						from: 'products',
						localField: 'orderItems.productId',
						foreignField: '_id',
						as: 'productDetails',
					},
				},
				// Lookup delivery address
				{
					$lookup: {
						from: 'addresses',
						localField: 'orderDeliveryAddressId',
						foreignField: '_id',
						as: 'deliveryAddress',
					},
				},
				{ $unwind: { path: '$deliveryAddress', preserveNullAndEmptyArrays: true } },
				// Lookup member data
				{
					$lookup: {
						from: 'members',
						localField: 'memberId',
						foreignField: '_id',
						as: 'member',
					},
				},
				{ $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
				// Merge product data into order items
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
				{ $project: { productDetails: 0 } },
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	// ! GET MY ORDERS (paginated)
	public async getMyOrders(memberId: ObjectId, input: MyOrdersInquiry): Promise<OrdersData> {
		const match: T = { memberId: memberId };

		if (input.search?.orderStatus) {
			match.orderStatus = input.search.orderStatus;
		}

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// Lookup order items
							{
								$lookup: {
									from: 'orderItems',
									localField: '_id',
									foreignField: 'orderId',
									as: 'orderItems',
								},
							},
							// Lookup delivery address
							{
								$lookup: {
									from: 'addresses',
									localField: 'orderDeliveryAddressId',
									foreignField: '_id',
									as: 'deliveryAddress',
								},
							},
							{ $unwind: { path: '$deliveryAddress', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return {
			orders: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE ORDER BY ADMIN
	public async updateOrderByAdmin(input: OrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const result = await this.orderModel.findByIdAndUpdate(orderId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		// If order is cancelled, restore stock (single bulkWrite)
		if (input.orderStatus === OrderStatus.CANCELLED) {
			const orderItems = await this.orderItemModel.find({ orderId }).lean().exec();
			if (orderItems.length) {
				await this.productModel.bulkWrite(
					orderItems.map((item) => ({
						updateOne: {
							filter: { _id: item.productId },
							update: { $inc: { productStockQuantity: item.itemQuantity } },
						},
					})),
				);
			}
		}

		// Notify member when order status meaningfully changes
		const statusMessages: Partial<Record<OrderStatus, string>> = {
			[OrderStatus.SHIPPED]: 'Your order is on its way!',
			[OrderStatus.DELIVERED]: 'Your order has been delivered',
			[OrderStatus.CANCELLED]: 'Your order has been cancelled',
		};
		const content = input.orderStatus ? statusMessages[input.orderStatus] : undefined;
		if (content) {
			this.notificationService
				.createNotification({
					authorId: result.memberId as unknown as ObjectId,
					receiverId: result.memberId as unknown as ObjectId,
					notificationType: NotificationType.ORDER,
					notificationGroup: NotificationGroup.ORDER,
					targetId: result._id as unknown as ObjectId,
					notificationTitle: 'Order Update',
					notificationContent: content,
				})
				.catch((err) => console.log('Notification error (order update):', err.message));

			// Email order status change
			if (input.orderStatus) {
				this.memberService
					.getMember(null, result.memberId as unknown as ObjectId)
					.then((m) => {
						if (m?.memberEmail) {
							this.mailService
								.sendOrderStatusEmail(m.memberEmail, result._id.toString(), input.orderStatus!)
								.catch((err) => console.log('Mail error (order status):', err.message));
						}
					})
					.catch(() => {});
			}
		}

		return result;
	}

	// ! GET ALL ORDERS BY ADMIN (paginated)
	public async getAllOrdersByAdmin(input: AllOrdersInquiry): Promise<OrdersData> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			if (input.search.orderStatus) match.orderStatus = input.search.orderStatus;
			if (input.search.orderPaymentStatus) match.orderPaymentStatus = input.search.orderPaymentStatus;
			if (input.search.memberId) match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// Lookup order items
							{
								$lookup: {
									from: 'orderItems',
									localField: '_id',
									foreignField: 'orderId',
									as: 'orderItems',
								},
							},
							// Lookup member
							{
								$lookup: {
									from: 'members',
									localField: 'memberId',
									foreignField: '_id',
									as: 'member',
								},
							},
							{ $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
							// Lookup delivery address
							{
								$lookup: {
									from: 'addresses',
									localField: 'orderDeliveryAddressId',
									foreignField: '_id',
									as: 'deliveryAddress',
								},
							},
							{ $unwind: { path: '$deliveryAddress', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return {
			orders: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}
}
