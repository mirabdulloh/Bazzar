import { Schema } from 'mongoose';
import { OrderDeliveryStatus, OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		orderStatus: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING,
		},

		orderTotalPrice: {
			type: Number,
			required: true,
		},

		orderTotalDiscountPrice: {
			type: Number,
			default: 0,
		},

		orderFinalPrice: {
			type: Number,
			required: true,
		},

		orderPaymentMethod: {
			type: String,
			enum: OrderPaymentMethod,
			default: OrderPaymentMethod.CREDIT_CARD,
		},

		orderPaymentStatus: {
			type: String,
			enum: OrderPaymentStatus,
			default: OrderPaymentStatus.PENDING,
		},

		orderDeliveryAddressId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		orderDeliveryStatus: {
			type: String,
			enum: OrderDeliveryStatus,
			default: OrderDeliveryStatus.PREPARING,
		},
	},
	{ timestamps: true, collection: 'orders' },
);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ memberId: 1, orderStatus: 1 });

export default OrderSchema;
