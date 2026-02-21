import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ReviewStatus } from '../../libs/enums/review.enum';
import { ReviewInput, ReviewsInquiry, AllReviewsInquiry } from '../../libs/dto/review/review.input';
import { Review, Reviews } from '../../libs/dto/review/review';
import { ReviewUpdate } from '../../libs/dto/review/review.update';
import { Product } from '../../libs/dto/product/product';
import { OrderItem } from '../../libs/dto/order-items/order-item';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

@Injectable()
export class ReviewService {
	constructor(
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Order') private readonly orderModel: Model<any>,
	) {}

	public async createReview(memberId: ObjectId, input: ReviewInput): Promise<Review> {
		// Validate orderItem exists and productId matches
		const orderItem = await this.orderItemModel.findById(input.orderItemId).exec();
		if (!orderItem) throw new BadRequestException(Message.NO_DATA_FOUND);
		if (orderItem.productId.toString() !== input.productId.toString()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		// Validate the order belongs to this member
		const order = await this.orderModel.findOne({ _id: orderItem.orderId, memberId }).exec();
		if (!order) throw new BadRequestException(Message.BAD_REQUEST);

		// Prevent duplicate review for the same orderItem
		const existing = await this.reviewModel.findOne({ orderItemId: input.orderItemId }).exec();
		if (existing) throw new BadRequestException(Message.CREATE_FAILED);

		input.memberId = memberId;

		let result = null;
		try {
			result = await this.reviewModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		// Recalculate product rating — atomic aggregation pipeline update
		await this.productModel
			.findByIdAndUpdate(input.productId, [
				{
					$set: {
						productRatingCount: { $add: ['$productRatingCount', 1] },
						productRatingAverage: {
							$divide: [
								{ $add: [{ $multiply: ['$productRatingAverage', '$productRatingCount'] }, input.reviewRating] },
								{ $add: ['$productRatingCount', 1] },
							],
						},
					},
				},
			])
			.exec();

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async updateReview(memberId: ObjectId, input: ReviewUpdate): Promise<Review> {
		const { _id, reviewRating } = input;

		// Fetch current review to get old rating before update
		const current = await this.reviewModel.findOne({ _id, memberId, reviewStatus: ReviewStatus.ACTIVE }).exec();
		if (!current) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const result = await this.reviewModel
			.findOneAndUpdate({ _id, memberId, reviewStatus: ReviewStatus.ACTIVE }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		// Recalculate product rating if rating changed
		if (reviewRating && reviewRating !== current.reviewRating) {
			await this.productModel
				.findByIdAndUpdate(current.productId, [
					{
						$set: {
							productRatingAverage: {
								$divide: [
									{
										$add: [
											{ $multiply: ['$productRatingAverage', '$productRatingCount'] },
											{ $subtract: [reviewRating, current.reviewRating] },
										],
									},
									'$productRatingCount',
								],
							},
						},
					},
				])
				.exec();
		}

		return result;
	}

	public async getReviews(_memberId: ObjectId, input: ReviewsInquiry): Promise<Reviews> {
		const { productId } = input.search;
		const match: T = { productId, reviewStatus: ReviewStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** ADMIN */

	public async getAllReviewsByAdmin(input: AllReviewsInquiry): Promise<Reviews> {
		const { productId, reviewStatus } = input.search ?? {};
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (productId) match.productId = productId;
		if (reviewStatus) match.reviewStatus = reviewStatus;

		const result = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateReviewByAdmin(input: ReviewUpdate): Promise<Review> {
		const { _id } = input;
		const result = await this.reviewModel
			.findOneAndUpdate({ _id, reviewStatus: { $ne: ReviewStatus.DELETED } }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeReviewByAdmin(reviewId: ObjectId): Promise<Review> {
		const target = await this.reviewModel.findOne({ _id: reviewId, reviewStatus: ReviewStatus.DELETED }).exec();
		if (!target) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		const result = await this.reviewModel.findByIdAndDelete(reviewId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		// Recalculate product rating — remove this review's contribution
		await this.productModel
			.findByIdAndUpdate(target.productId, [
				{
					$set: {
						productRatingCount: { $max: [0, { $subtract: ['$productRatingCount', 1] }] },
						productRatingAverage: {
							$cond: {
								if: { $lte: ['$productRatingCount', 1] },
								then: 0,
								else: {
									$divide: [
										{
											$subtract: [{ $multiply: ['$productRatingAverage', '$productRatingCount'] }, target.reviewRating],
										},
										{ $subtract: ['$productRatingCount', 1] },
									],
								},
							},
						},
					},
				},
			])
			.exec();

		return result;
	}
}
