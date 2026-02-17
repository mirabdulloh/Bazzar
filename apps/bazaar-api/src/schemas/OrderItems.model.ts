import { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		productId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		priceAtPurchase: {
			type: Number,
			required: true,
		},

		itemQuantity: {
			type: Number,
			required: true,
		},

		subtotal: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true, collection: 'orderItems' },
);

export default OrderItemSchema;
