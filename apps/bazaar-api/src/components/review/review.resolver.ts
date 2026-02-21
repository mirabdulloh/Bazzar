import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Review, Reviews } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry, AllReviewsInquiry } from '../../libs/dto/review/review.input';
import { ReviewUpdate } from '../../libs/dto/review/review.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ReviewResolver {
	constructor(private readonly reviewService: ReviewService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Review)
	public async createReview(@Args('input') input: ReviewInput, @AuthMember('_id') memberId: ObjectId): Promise<Review> {
		console.log('Mutation: createReview');
		input.productId = shapeIntoMongoObjectId(input.productId);
		input.orderItemId = shapeIntoMongoObjectId(input.orderItemId);
		return await this.reviewService.createReview(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Review)
	public async updateReview(
		@Args('input') input: ReviewUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Review> {
		console.log('Mutation: updateReview');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.reviewService.updateReview(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Reviews)
	public async getReviews(
		@Args('input') input: ReviewsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reviews> {
		console.log('Query: getReviews');
		input.search.productId = shapeIntoMongoObjectId(input.search.productId);
		return await this.reviewService.getReviews(memberId, input);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Reviews)
	public async getAllReviewsByAdmin(@Args('input') input: AllReviewsInquiry): Promise<Reviews> {
		console.log('Query: getAllReviewsByAdmin');
		if (input.search?.productId) input.search.productId = shapeIntoMongoObjectId(input.search.productId);
		return await this.reviewService.getAllReviewsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Review)
	public async updateReviewByAdmin(@Args('input') input: ReviewUpdate): Promise<Review> {
		console.log('Mutation: updateReviewByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.reviewService.updateReviewByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Review)
	public async removeReviewByAdmin(@Args('reviewId') input: string): Promise<Review> {
		console.log('Mutation: removeReviewByAdmin');
		const reviewId = shapeIntoMongoObjectId(input);
		return await this.reviewService.removeReviewByAdmin(reviewId);
	}
}
