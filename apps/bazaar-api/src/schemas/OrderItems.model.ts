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

		selectedSize: {
			type: String,
		},

		selectedColor: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'orderItems' },
);

OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });

export default OrderItemSchema;
