import { Schema } from 'mongoose';

const AddressSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		addressName: {
			type: String,
			required: true,
		},

		addressPhone: {
			type: String,
			required: true,
		},

		addressCountry: {
			type: String,
			required: true,
		},

		addressCity: {
			type: String,
			required: true,
		},

		addressZipCode: {
			type: String,
			required: true,
		},

		addressLine1: {
			type: String,
			required: true,
		},

		addressLine2: {
			type: String,
		},

		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true, collection: 'addresses' },
);

export default AddressSchema;
