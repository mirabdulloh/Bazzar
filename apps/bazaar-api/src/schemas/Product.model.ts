import { Schema } from 'mongoose';
import { ProductStatus, ProductType } from '../libs/enums/products.enum';

const ProductSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		productType: {
			type: String,
			enum: ProductType,
			required: true,
		},

		productCategoryId: {
			type: Schema.Types.ObjectId,
		},

		productStatus: {
			type: String,
			enum: ProductStatus,
			default: ProductStatus.DRAFT,
		},

		productTitle: {
			type: String,
			required: true,
		},

		productPrice: {
			type: Number,
			required: true,
		},

		productDiscountPrice: {
			type: Number,
			default: 0,
		},

		productViews: {
			type: Number,
			default: 0,
		},

		productLikes: {
			type: Number,
			default: 0,
		},

		productComments: {
			type: Number,
			default: 0,
		},

		productRank: {
			type: Number,
			default: 0,
		},

		productImages: {
			type: [String],
			required: true,
			default: [],
		},

		productRatingAverage: {
			type: Number,
			default: 0,
		},

		productRatingCount: {
			type: Number,
			default: 0,
		},

		productStockQuantity: {
			type: Number,
			default: 0,
		},

		productDesc: {
			type: String,
		},

		productSize: {
			type: String,
			required: true,
		},

		productColor: {
			type: String,
			required: true,
		},

		productMaterials: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'products' },
);

ProductSchema.index({ productStatus: 1, createdAt: -1 });
ProductSchema.index({ memberId: 1, productStatus: 1 });
ProductSchema.index({ productCategoryId: 1, productStatus: 1 });
ProductSchema.index({ productTitle: 'text' });

export default ProductSchema;
