import { Schema } from 'mongoose';
import { AddressStatus } from '../libs/enums/address.enum';

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

		addressStatus: {
			type: String,
			enum: AddressStatus,
			default: AddressStatus.ACTIVE,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'addresses' },
);

export default AddressSchema;
