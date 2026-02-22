import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { Member, MembersData } from '../../libs/dto/member/member';
import { Brand } from '../../libs/dto/brand/brand';
import { Coupon } from '../../libs/dto/coupons/coupon';
import { InjectModel } from '@nestjs/mongoose';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { CouponStatus, CouponType } from '../../libs/enums/coupons.enum';
import {
	BrandInquiry,
	ChangePasswordInput,
	LoginInput,
	MemberInput,
	MembersInquiry,
} from '../../libs/dto/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { MemberUpdate, MemberUpdateByAdmin } from '../../libs/dto/member/member.update';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked, shapeIntoMongoObjectId } from '../../libs/config';
import { StatisticModifier, T } from '../../libs/types/common';
import { LikeInput } from '../../libs/dto/likes/like.input';
import { LikeGroup } from '../../libs/enums/likes.enum';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Brand') private readonly brandModel: Model<Brand>,
		@InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
		private authService: AuthService,
		private likeService: LikeService,
		private viewService: ViewService,
		private mailService: MailService,
	) {}

	// ! Sign Up
	public async signup(input: MemberInput): Promise<Member> {
		// Password Hashed
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);
		try {
			const result = await this.memberModel.create(input);

			// Auto-create Brand document if memberType is BRAND
			// Brand._id = Member._id (same ObjectId), starts as PENDING until admin approves
			if (result.memberType === MemberType.BRAND) {
				await this.brandModel.create({
					_id: result._id,
					brandName: result.memberNick,
					brandLogo: input.brandLogo ?? '',
					brandStatus: BrandStatus.PENDING,
				});
			}

			// Auto-assign WELCOME coupon for new USER members
			if (result.memberType === MemberType.USER) {
				const now = new Date();
				const welcomeCoupon = await this.couponModel
					.findOne({
						couponCode: 'WELCOME',
						couponType: CouponType.PLATFORM,
						couponStatus: CouponStatus.ACTIVE,
						couponStartDate: { $lte: now },
						couponEndDate: { $gte: now },
					})
					.exec();
				if (welcomeCoupon) {
					const limitOk =
						welcomeCoupon.couponMaxUsage === undefined || welcomeCoupon.couponUsageCount < welcomeCoupon.couponMaxUsage;
					if (limitOk) {
						await this.memberModel.findByIdAndUpdate(result._id, {
							memberCouponId: welcomeCoupon._id,
							memberCouponStatus: CouponStatus.ACTIVE,
							memberCouponAssignedAt: now,
						});
					}
				}
			}

			// Send welcome email for new USER members who provided an email
			if (result.memberType === MemberType.USER && result.memberEmail) {
				this.mailService
					.sendWelcomeEmail(result.memberEmail, result.memberNick)
					.catch((err) => console.log('Mail error (welcome):', err.message));
			}

			// Authentication via token
			result.accessToken = await this.authService.createToken(result);
			console.log('accessToken =>,', result);
			return result;
		} catch (err) {
			console.log('Error on SignUP Service', err.message);
			if (err?.code === 11000) {
				throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
			throw new BadRequestException(err.message);
		}
	}

	// ! Login
	public async login(input: LoginInput): Promise<Member> {
		const { memberNick } = input;
		const response: Member = await this.memberModel.findOne({ memberNick }).select('+memberPassword').exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);
		if (!isMatch) throw new ForbiddenException(Message.WRONG_PASSWORD);
		response.accessToken = await this.authService.createToken(response);

		return response;
	}

	// 	const { page, limit, sort = 'createdAt', direction = -1, search } = input;

	// 	const query: any = {};

	// 	// Filter by member type
	// 	if (search.memberType) {
	// 		query.memberType = search.memberType;
	// 	}

	// 	// Filter by member status
	// 	if (search.memberStatus) {
	// 		query.memberStatus = search.memberStatus;
	// 	}

	// 	// Search by text (memberNick or memberEmail)
	// 	if (search.text) {
	// 		query.$or = [
	// 			{ memberNick: { $regex: search.text, $options: 'i' } },
	// 			{ memberEmail: { $regex: search.text, $options: 'i' } },
	// 		];
	// 	}

	// 	// Execute query with pagination
	// 	const [members, total] = await Promise.all([
	// 		this.memberModel
	// 			.find(query)
	// 			.select('-memberPassword') // Never return password
	// 			.skip((page - 1) * limit)
	// 			.limit(limit)
	// 			.sort({ [sort]: direction })
	// 			.lean()
	// 			.exec(),
	// 		this.memberModel.countDocuments(query),
	// 	]);

	// 	return {
	// 		members,
	// 		metaData: {
	// 			total,
	// 			page,
	// 			limit,
	// 		},
	// 	};
	// }

	// ! Get Brands (Paginated List)
	public async getBrands(memberId: ObjectId, input: BrandInquiry): Promise<MembersData> {
		console.log('MemberService: getAgents');
		const { text } = input.search;
		const match: T = { memberType: MemberType.BRAND, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match =>', match);

		const result = await this.memberModel.aggregate([
			{ $match: match },
			{ $sort: sort },
			{
				$facet: {
					list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }, lookupAuthMemberLiked(memberId)],
					metaCounter: [{ $count: 'total' }],
				},
			},
		]);
		console.log('getAgents Result =>', result);
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const list = result[0]?.list ?? [];
		const total = result[0]?.metaCounter?.[0]?.total ?? 0;
		return {
			members: list,
			metaData: {
				total,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! Get Single Member by ID
	public async getMember(memberId: ObjectId | null, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};

		const targetMember = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = {
				memberId: memberId,
				viewRefId: targetId,
				viewGroup: ViewGroup.MEMBER,
			};

			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
				targetMember.memberViews++;
			}
		}

		const result = await this.memberModel
			.aggregate([
				{ $match: search },
				...(memberId
					? [
							lookupAuthMemberLiked(memberId, '_id'),
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$_id' }),
						]
					: []),
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	// ! Get Members List (Paginated)
	public async getMembers(input: MembersInquiry): Promise<MembersData> {
		const page = Math.max(1, input.page ?? 1);
		const limit = Math.min(Math.max(1, input.limit ?? 20), 50);

		const sort = input?.sort ?? 'createdAt';
		const direction = input?.direction ?? Direction.DESC;

		const { search } = input;
		const match: any = {
			memberType: { $ne: MemberType.BRAND }, // ✅ exclude brands
			memberStatus: { $nin: [MemberStatus.DELETE, MemberStatus.BLOCK] }, // ✅ exclude delete + block
		};

		// optional filters (keep only if you want to allow admin-like filtering)
		if (search?.memberType) match.memberType = search.memberType; // (if you still want filtering)
		if (search?.memberStatus) match.memberStatus = search.memberStatus;

		if (search?.text?.trim()) {
			const text = search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
			match.$or = [
				{ memberNick: { $regex: new RegExp(text, 'i') } },
				{ memberEmail: { $regex: new RegExp(text, 'i') } },
				{ memberPhone: { $regex: new RegExp(text, 'i') } },
			];
		}

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: { [sort]: direction } },
				{
					$facet: {
						members: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{ $project: { memberPassword: 0 } }, // ✅ never return password
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
				{
					$addFields: {
						total: { $ifNull: [{ $arrayElemAt: ['$metaCounter.total', 0] }, 0] },
					},
				},
				{
					$project: {
						members: 1,
						metaData: {
							total: '$total',
							page: { $literal: page },
							limit: { $literal: limit },
						},
					},
				},
			])
			.exec();

		return result?.[0] ?? { members: [], metaData: { total: 0, page, limit } };
	}

	// ! Update Member Profile
	public async updateMember(memberId: string, input: MemberUpdate): Promise<Member> {
		// Remove _id from input if present
		delete input._id;

		// Check for unique constraints if updating nick, email, or phone
		if (input.memberNick || input.memberEmail || input.memberPhone) {
			const duplicateQuery: any = {
				_id: { $ne: shapeIntoMongoObjectId(memberId) },
				$or: [],
			};

			if (input.memberNick) duplicateQuery.$or.push({ memberNick: input.memberNick });
			if (input.memberEmail) duplicateQuery.$or.push({ memberEmail: input.memberEmail });
			if (input.memberPhone) duplicateQuery.$or.push({ memberPhone: input.memberPhone });

			const duplicate = await this.memberModel.findOne(duplicateQuery).exec();
			if (duplicate) {
				throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
		}

		// Update member
		const updatedMember = await this.memberModel
			.findByIdAndUpdate(shapeIntoMongoObjectId(memberId), input, { new: true })
			.select('-memberPassword')
			.exec();

		if (!updatedMember) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return updatedMember;
	}

	// ! Change Password
	public async changePassword(memberId: string, input: ChangePasswordInput): Promise<Member> {
		const member = await this.memberModel.findById(shapeIntoMongoObjectId(memberId)).select('+memberPassword').exec();

		if (!member) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		// Verify old password
		const isMatch = await this.authService.comparePasswords(input.oldPassword, member.memberPassword);
		if (!isMatch) {
			throw new ForbiddenException(Message.WRONG_PASSWORD);
		}

		// Hash new password
		const hashedPassword = await this.authService.hashPassword(input.newPassword);

		// Update password
		member.memberPassword = hashedPassword;
		await member.save();

		// Return member without password
		const result = member.toObject();
		delete result.memberPassword;

		return result;
	}

	// ! Like Target Member
	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target: Member = await this.memberModel.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = { memberId, likeRefId, likeGroup: LikeGroup.MEMBER };
		// LIke TOggle

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEdits({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	// ! Admin: Update Member (can update any field including status)
	public async updateMemberByAdmin(input: MemberUpdateByAdmin): Promise<Member> {
		const memberId = input._id;
		delete input._id;

		// If changing status to DELETE, set deletedAt
		if (input.memberStatus === MemberStatus.DELETE && !input.deletedAt) {
			input.deletedAt = new Date();
		}

		// If changing status to ACTIVE, clear deletedAt
		if (input.memberStatus === MemberStatus.ACTIVE) {
			input.deletedAt = null;
		}

		// Check for unique constraints if updating nick, email, or phone
		if (input.memberNick || input.memberEmail || input.memberPhone) {
			const duplicateQuery: any = {
				_id: { $ne: shapeIntoMongoObjectId(memberId) },
				$or: [],
			};

			if (input.memberNick) duplicateQuery.$or.push({ memberNick: input.memberNick });
			if (input.memberEmail) duplicateQuery.$or.push({ memberEmail: input.memberEmail });
			if (input.memberPhone) duplicateQuery.$or.push({ memberPhone: input.memberPhone });

			const duplicate = await this.memberModel.findOne(duplicateQuery).exec();
			if (duplicate) {
				throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
		}

		// Update member
		const updatedMember = await this.memberModel
			.findByIdAndUpdate(shapeIntoMongoObjectId(memberId), input, { new: true })
			.select('-memberPassword')
			.exec();

		if (!updatedMember) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return updatedMember;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<MembersData> {
		console.log('MemberService: getAgents');
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match =>', match);

		const result = await this.memberModel.aggregate([
			{ $match: match },
			{ $sort: sort },
			{
				$facet: {
					list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
					metaCounter: [{ $count: 'total' }],
				},
			},
		]);
		console.log('getAgents Result =>', result);
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const list = result[0]?.list ?? [];
		const total = result[0]?.metaCounter?.[0]?.total ?? 0;

		return {
			members: list,
			metaData: {
				total,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	public async memberStatsEdits(input: StatisticModifier): Promise<Member> {
		console.log('Executed');
		const { _id, targetKey, modifier } = input;
		return await this.memberModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}
}
