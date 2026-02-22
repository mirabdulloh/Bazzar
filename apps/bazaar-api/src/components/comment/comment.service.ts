import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import { ProductsService } from '../products/products.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { NotificationService } from '../notification/notification.service';
import { CommentGroup, CommentStatus } from '../../libs/enums/comments.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comments/comment.input';
import { Comment, Comments } from '../../libs/dto/comments/comment';
import { CommentUpdate } from '../../libs/dto/comments/comment.update';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

@Injectable()
export class CommentService {
	private readonly logger = new Logger(CommentService.name);

	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly memberService: MemberService,
		private readonly productsService: ProductsService,
		private readonly boardArticleService: BoardArticleService,
		private readonly notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;

		// Validate parent comment exists when this is a reply
		if (input.commentReplyId) {
			const parent = await this.commentModel
				.findOne({ _id: input.commentReplyId, commentStatus: CommentStatus.ACTIVE })
				.exec();
			if (!parent) throw new BadRequestException(Message.NO_DATA_FOUND);
		}

		let result = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			this.logger.error('createComment failed:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		// Only increment target stats for top-level comments, not replies
		if (!input.commentReplyId) {
			switch (input.commentGroup) {
				case CommentGroup.PRODUCT:
					await this.productsService.productStatsEdits({
						_id: input.commentRefId,
						targetKey: 'productComments',
						modifier: 1,
					});
					break;

				case CommentGroup.ARTICLE:
					await this.boardArticleService.boardArticleStatsEditor({
						_id: input.commentRefId,
						targetKey: 'articleComments',
						modifier: 1,
					});
					break;

				case CommentGroup.MEMBER:
					await this.memberService.memberStatsEdits({
						_id: input.commentRefId,
						targetKey: 'memberComments',
						modifier: 1,
					});
					// Notify the member that someone commented on their profile
					if (memberId.toString() !== input.commentRefId.toString()) {
						this.notificationService
							.createNotification({
								authorId: memberId,
								receiverId: input.commentRefId,
								notificationType: NotificationType.OTHER,
								notificationGroup: NotificationGroup.MEMBER,
								targetId: result._id as unknown as ObjectId,
								notificationTitle: 'New Comment',
								notificationContent: 'Someone left a comment on your profile',
							})
							.catch((err) => this.logger.error('Notification error (comment):', err.message));
					}
					break;
			}
		}

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id, commentStatus } = input;

		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		// Decrement target stats when user soft-deletes a top-level comment
		if (commentStatus === CommentStatus.DELETED && !result.commentReplyId) {
			await this.commentStatsEditor(result.commentGroup, result.commentRefId, -1);
		}

		return result;
	}

	public async getComments(_memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.commentModel
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
							{
								$lookup: {
									from: 'comments',
									localField: 'commentReplyId',
									foreignField: '_id',
									as: 'parentCommentData',
								},
							},
							{ $unwind: { path: '$parentCommentData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	/** ADMIN */

	public async removeCommentByAdmin(commentId: ObjectId): Promise<Comment> {
		const target = await this.commentModel.findById(commentId).exec();
		if (!target) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		const result = await this.commentModel.findByIdAndDelete(commentId);
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		// Decrement target stats only for top-level comments
		if (!target.commentReplyId) {
			await this.commentStatsEditor(target.commentGroup, target.commentRefId, -1);
		}

		return result;
	}

	private async commentStatsEditor(commentGroup: CommentGroup, commentRefId: ObjectId, modifier: number): Promise<void> {
		switch (commentGroup) {
			case CommentGroup.PRODUCT:
				await this.productsService.productStatsEdits({
					_id: commentRefId,
					targetKey: 'productComments',
					modifier,
				});
				break;

			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: commentRefId,
					targetKey: 'articleComments',
					modifier,
				});
				break;

			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEdits({
					_id: commentRefId,
					targetKey: 'memberComments',
					modifier,
				});
				break;
		}
	}
}
