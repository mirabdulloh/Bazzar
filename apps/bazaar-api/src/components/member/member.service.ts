import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Member, MembersData } from '../../libs/dto/member/member';
import { InjectModel } from '@nestjs/mongoose';
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
import { shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private authService: AuthService,
	) {}

	// ! Sing Up
	public async signup(input: MemberInput): Promise<Member> {
		// Password Hashed
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);
		try {
			const result = await this.memberModel.create(input);
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

	// // ! Get Members (Paginated List)
	// public async getMembers(input: MembersInquiry): Promise<MembersData> {
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
	public async getBrands(memberId: string | null, input: BrandInquiry): Promise<MembersData> {
		const { page, limit, sort = 'createdAt', direction = -1, search } = input;

		// same logic as your query
		const match: any = {
			memberType: MemberType.BRAND,
			memberStatus: { $ne: MemberStatus.DELETE },
		};

		if (search?.memberStatus) {
			match.memberStatus = search.memberStatus;
		}

		if (search?.text) {
			match.$or = [
				{ memberNick: { $regex: search.text, $options: 'i' } },
				{ memberEmail: { $regex: search.text, $options: 'i' } },
			];
		}

		const sortStage: any = { [sort]: direction };

		const result = await this.memberModel.aggregate([
			{ $match: match },
			{ $sort: sortStage },
			{
				$facet: {
					members: [
						{ $skip: (page - 1) * limit },
						{ $limit: limit },
						{ $project: { memberPassword: 0 } }, // same as .select('-memberPassword')
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
		]);

		return result?.[0] ?? { members: [], metaData: { total: 0, page, limit } };
	}

	// ! Get Single Member by ID
	public async getMember(memberId: string): Promise<Member> {
		const member = await this.memberModel
			.findOne({
				_id: shapeIntoMongoObjectId(memberId),
				memberStatus: { $ne: MemberStatus.DELETE },
			})
			.select('-memberPassword')
			.lean()
			.exec();

		if (!member) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return member;
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
}
