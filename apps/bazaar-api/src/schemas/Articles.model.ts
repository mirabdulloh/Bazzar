import { Schema } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../libs/enums/articles.enum';

const ArticleSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		articleCategory: {
			type: String,
			enum: ArticleCategory,
			default: ArticleCategory.OTHER,
		},

		articleStatus: {
			type: String,
			enum: ArticleStatus,
			default: ArticleStatus.ACTIVE,
		},

		articleTitle: {
			type: String,
			required: true,
		},

		articleContent: {
			type: String,
			required: true,
		},

		articleImages: {
			type: [String],
			default: [],
		},

		articleViews: {
			type: Number,
			default: 0,
		},

		articleLikes: {
			type: Number,
			default: 0,
		},

		articleComments: {
			type: Number,
			default: 0,
		},
		publishedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'articles' },
);

export default ArticleSchema;
