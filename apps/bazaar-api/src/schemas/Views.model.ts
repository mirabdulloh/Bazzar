import { Schema } from 'mongoose';
import { ViewGroup } from '../libs/enums/view.enum';

const ViewSchema = new Schema(
	{
		viewGroup: {
			type: String,
			enum: ViewGroup,
			required: true,
		},

		viewRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
	},
	{ timestamps: true, collection: 'views' },
);

// prevent duplicate views per target
ViewSchema.index({ memberId: 1, viewGroup: 1, viewRefId: 1 }, { unique: true });

export default ViewSchema;
