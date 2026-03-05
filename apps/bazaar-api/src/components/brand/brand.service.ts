import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Brand, BrandsData } from '../../libs/dto/brand/brand';
import { Member } from '../../libs/dto/member/member';
import { BrandsInquiry, AllBrandsInquiry } from '../../libs/dto/brand/brand.input';
import { BrandUpdate, BrandUpdateByAdmin } from '../../libs/dto/brand/brand.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { lookupAuthMemberLiked, lookupBrandMemberData, shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class BrandService {
	private readonly logger = new Logger(BrandService.name);

	constructor(
		@InjectModel('Brand') private readonly brandModel: Model<Brand>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly viewService: ViewService,
	) {}

	// ! AUTO-CREATE BRAND ON SIGNUP (called from MemberService when memberType = BRAND)
	// Brand starts as PENDING — admin must approve before brand can add logo/products
	public async createBrandOnSignup(memberId: ObjectId, memberNick: string): Promise<Brand> {
		try {
			// _id = memberId so Brand document is identified by the same ObjectId as the member
			const result = await this.brandModel.create({
				_id: memberId,
				brandName: memberNick, // initial name from nick; brand can update later
				brandLogo: '',
				brandStatus: BrandStatus.PENDING,
				brandRating: 0,
				brandFollowersCount: 0,
				brandReviewsCount: 0,
			});
			return result;
		} catch (err) {
			this.logger.error('createBrandOnSignup failed:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! UPDATE BRAND PROFILE (Brand owner — only name, logo, desc — NOT status)
	public async updateBrand(memberId: ObjectId, input: BrandUpdate): Promise<Brand> {
		// Only ACTIVE brands can update their profile
		const existing = await this.brandModel.findOne({ _id: memberId, brandStatus: BrandStatus.ACTIVE }).exec();
		if (!existing) throw new BadRequestException('Brand is not active yet. Please wait for admin approval.');

		delete input._id;
		const result = await this.brandModel.findByIdAndUpdate(memberId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		return result;
	}

	// ! GET MY BRAND (logged-in brand member views their own brand)
	public async getMyBrand(memberId: ObjectId): Promise<Brand> {
		const result = await this.brandModel.findById(memberId).exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);
		if (result.brandRating == null) result.brandRating = 0;
		if (result.brandFollowersCount == null) result.brandFollowersCount = 0;
		if (result.brandReviewsCount == null) result.brandReviewsCount = 0;
		return result;
	}

	// ! GET SINGLE BRAND (public — increments memberViews when called by logged-in user)
	public async getBrand(brandId: ObjectId, memberId?: ObjectId): Promise<Brand> {
		const result = await this.brandModel
			.aggregate([
				{ $match: { _id: brandId, brandStatus: { $ne: BrandStatus.SUSPENDED } } },
				{
					$addFields: {
						brandRating: { $ifNull: ['$brandRating', 0] },
						brandFollowersCount: { $ifNull: ['$brandFollowersCount', 0] },
						brandReviewsCount: { $ifNull: ['$brandReviewsCount', 0] },
					},
				},
				lookupBrandMemberData,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		// Track view — Brand._id === Member._id by design, so increment memberViews
		if (memberId) {
			const newView = await this.viewService.recordView({
				memberId,
				viewRefId: brandId,
				viewGroup: ViewGroup.MEMBER,
			});
			if (newView) {
				await this.memberModel.findByIdAndUpdate(brandId, { $inc: { memberViews: 1 } }).exec();
			}
		}

		return result[0];
	}

	// ! GET BRANDS (public paginated — only ACTIVE brands)
	public async getBrands(input: BrandsInquiry, memberId?: ObjectId): Promise<BrandsData> {
		const match: T = { brandStatus: BrandStatus.ACTIVE };
		const sortKey = input?.sort ?? 'createdAt';
		const sortDir = input?.direction ?? Direction.DESC;
		const sort: T = { [sortKey]: sortDir };

		if (input.search?.text) {
			match.brandName = { $regex: new RegExp(input.search.text, 'i') };
		}

		const listPipeline: PipelineStage[] = [
			...(sortKey === 'memberRank' ? [] : [{ $sort: sort }]),
			...(sortKey === 'memberRank' ? [] : [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }]),
			{
				$addFields: {
					brandRating: { $ifNull: ['$brandRating', 0] },
					brandFollowersCount: { $ifNull: ['$brandFollowersCount', 0] },
					brandReviewsCount: { $ifNull: ['$brandReviewsCount', 0] },
				},
			},
			lookupBrandMemberData,
			{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
			{ $addFields: { memberRank: { $ifNull: ['$memberData.memberRank', 0] } } },
			...(memberId ? [lookupAuthMemberLiked(memberId)] : []),
			...(sortKey === 'memberRank'
				? [{ $sort: { memberRank: sortDir } }, { $skip: (input.page - 1) * input.limit }, { $limit: input.limit }]
				: []),
		];

		const result = await this.brandModel
			.aggregate([
				{ $match: match },
				{
					$facet: {
						list: listPipeline as any,
						metaCounter: [{ $count: 'total' }],
					},
				},
			] as PipelineStage[])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return {
			brands: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE BRAND BY ADMIN (approve: PENDING → ACTIVE, SUSPEND, edit any field)
	public async updateBrandByAdmin(input: BrandUpdateByAdmin): Promise<Brand> {
		const brandId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const result = await this.brandModel.findByIdAndUpdate(brandId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		return result;
	}

	// ! GET ALL BRANDS BY ADMIN (paginated — all statuses including PENDING)
	public async getAllBrandsByAdmin(input: AllBrandsInquiry): Promise<BrandsData> {
		const match: T = {};
		const sortKey = input?.sort ?? 'createdAt';
		const sortDir = input?.direction ?? Direction.DESC;
		const sort: T = { [sortKey]: sortDir };

		if (input.search) {
			if (input.search.brandStatus) match.brandStatus = input.search.brandStatus;
			if (input.search.text) match.brandName = { $regex: new RegExp(input.search.text, 'i') };
		}

		const adminListPipeline: PipelineStage[] = [
			...(sortKey === 'memberRank' ? [] : [{ $sort: sort }]),
			...(sortKey === 'memberRank' ? [] : [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }]),
			{
				$addFields: {
					brandRating: { $ifNull: ['$brandRating', 0] },
					brandFollowersCount: { $ifNull: ['$brandFollowersCount', 0] },
					brandReviewsCount: { $ifNull: ['$brandReviewsCount', 0] },
				},
			},
			lookupBrandMemberData,
			{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
			{ $addFields: { memberRank: { $ifNull: ['$memberData.memberRank', 0] } } },
			...(sortKey === 'memberRank'
				? [{ $sort: { memberRank: sortDir } }, { $skip: (input.page - 1) * input.limit }, { $limit: input.limit }]
				: []),
		];

		const result = await this.brandModel
			.aggregate([
				{ $match: match },
				{
					$facet: {
						list: adminListPipeline as any,
						metaCounter: [{ $count: 'total' }],
					},
				},
			] as PipelineStage[])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return {
			brands: result[0].list,
			metaData: {
				total: result[0].metaCounter[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! CHECK ACTIVE BRAND (used by ProductsService to validate before product creation)
	public async checkActiveBrand(memberId: ObjectId): Promise<boolean> {
		const brand = await this.brandModel.findOne({ _id: memberId, brandStatus: BrandStatus.ACTIVE }).exec();
		return !!brand;
	}
}
