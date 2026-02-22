import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Brand, BrandsData } from '../../libs/dto/brand/brand';
import { BrandsInquiry, AllBrandsInquiry } from '../../libs/dto/brand/brand.input';
import { BrandUpdate, BrandUpdateByAdmin } from '../../libs/dto/brand/brand.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { lookupBrandMemberData, shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class BrandService {
	private readonly logger = new Logger(BrandService.name);

	constructor(@InjectModel('Brand') private readonly brandModel: Model<Brand>) {}

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

		const result = await this.brandModel.findByIdAndUpdate(memberId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.UPDATE_FAILED);

		return result;
	}

	// ! GET MY BRAND (logged-in brand member views their own brand)
	public async getMyBrand(memberId: ObjectId): Promise<Brand> {
		const result = await this.brandModel.findById(memberId).exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result;
	}

	// ! GET SINGLE BRAND (public)
	public async getBrand(brandId: ObjectId): Promise<Brand> {
		const result = await this.brandModel
			.aggregate([
				{ $match: { _id: brandId, brandStatus: { $ne: BrandStatus.SUSPENDED } } },
				lookupBrandMemberData,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);
		return result[0];
	}

	// ! GET BRANDS (public paginated — only ACTIVE brands)
	public async getBrands(input: BrandsInquiry): Promise<BrandsData> {
		const match: T = { brandStatus: BrandStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.text) {
			match.brandName = { $regex: new RegExp(input.search.text, 'i') };
		}

		const result = await this.brandModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupBrandMemberData,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

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
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			if (input.search.brandStatus) match.brandStatus = input.search.brandStatus;
			if (input.search.text) match.brandName = { $regex: new RegExp(input.search.text, 'i') };
		}

		const result = await this.brandModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupBrandMemberData,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

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
