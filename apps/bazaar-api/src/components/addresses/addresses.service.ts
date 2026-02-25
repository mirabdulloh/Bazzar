import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Address, AddressesData } from '../../libs/dto/addresses/address';
import { AddressInput, AddressesInquiry } from '../../libs/dto/addresses/address.input';
import { AddressUpdate, AddressUpdateByAdmin } from '../../libs/dto/addresses/address.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AddressStatus } from '../../libs/enums/address.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class AddressesService {
	private readonly logger = new Logger(AddressesService.name);

	constructor(@InjectModel('Address') private readonly addressModel: Model<Address>) {}

	// ! CREATE ADDRESS
	public async createAddress(input: AddressInput): Promise<Address> {
		try {
			// If setting as default, unset other defaults
			if (input.isDefault) {
				await this.addressModel
					.updateMany({ memberId: input.memberId, isDefault: true }, { isDefault: false })
					.exec();
			}

			const result = await this.addressModel.create(input);
			return result;
		} catch (err) {
			this.logger.error('createAddress failed:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET MY ADDRESSES (only ACTIVE — excludes soft-deleted)
	public async getAddresses(memberId: ObjectId): Promise<Address[]> {
		const match: T = { memberId: memberId, addressStatus: AddressStatus.ACTIVE };

		const result = await this.addressModel.find(match).sort({ isDefault: -1, createdAt: -1 }).lean().exec();
		return result;
	}

	// ! UPDATE ADDRESS (user — only ACTIVE addresses, cannot change status/ownership)
	public async updateAddress(memberId: ObjectId, input: AddressUpdate): Promise<Address> {
		const addressId = input._id;
		delete input._id;

		// Verify ownership AND that address is still active (not soft-deleted)
		const existing = await this.addressModel
			.findOne({ _id: addressId, memberId: memberId, addressStatus: AddressStatus.ACTIVE })
			.exec();
		if (!existing) throw new NotFoundException(Message.NO_DATA_FOUND);

		// If setting as default, unset other active defaults first
		if (input.isDefault) {
			await this.addressModel
				.updateMany(
					{ memberId: memberId, isDefault: true, addressStatus: AddressStatus.ACTIVE, _id: { $ne: addressId } },
					{ isDefault: false },
				)
				.exec();
		}

		const result = await this.addressModel.findByIdAndUpdate(addressId, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	// ! DELETE ADDRESS (soft delete — keeps record for order history lookup)
	public async deleteAddress(memberId: ObjectId, addressId: ObjectId): Promise<Address> {
		const result = await this.addressModel
			.findOneAndUpdate(
				{ _id: addressId, memberId: memberId, addressStatus: AddressStatus.ACTIVE },
				{ addressStatus: AddressStatus.INACTIVE, deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result;
	}

	// ! GET ALL ADDRESSES BY ADMIN (paginated + filters)
	public async getAllAddressesByAdmin(input: AddressesInquiry): Promise<AddressesData> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search?.addressStatus) match.addressStatus = input.search.addressStatus;
		if (input.search?.memberId) match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		if (input.search?.text) {
			match.$or = [
				{ addressName: { $regex: new RegExp(input.search.text, 'i') } },
				{ addressCity: { $regex: new RegExp(input.search.text, 'i') } },
				{ addressPhone: { $regex: new RegExp(input.search.text, 'i') } },
			];
		}

		const result = await this.addressModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: result[0]?.list ?? [],
			metaData: {
				total: result[0]?.metaCounter?.[0]?.total ?? 0,
				page: input.page,
				limit: input.limit,
			},
		};
	}

	// ! UPDATE ADDRESS BY ADMIN (can change any field including status)
	public async updateAddressByAdmin(input: AddressUpdateByAdmin): Promise<Address> {
		const addressId = shapeIntoMongoObjectId(input._id);
		delete input._id;

		const result = await this.addressModel.findByIdAndUpdate(addressId, input, { new: true }).exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result;
	}
}
