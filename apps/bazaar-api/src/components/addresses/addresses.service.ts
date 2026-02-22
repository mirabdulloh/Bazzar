import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Address } from '../../libs/dto/addresses/address';
import { AddressInput } from '../../libs/dto/addresses/address.input';
import { AddressUpdate } from '../../libs/dto/addresses/address.update';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

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
			console.log('Error on createAddress Service', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ! GET MY ADDRESSES
	public async getAddresses(memberId: ObjectId): Promise<Address[]> {
		const match: T = { memberId: memberId };

		const result = await this.addressModel.find(match).sort({ isDefault: -1, createdAt: -1 }).lean().exec();
		return result;
	}

	// ! UPDATE ADDRESS
	public async updateAddress(memberId: ObjectId, input: AddressUpdate): Promise<Address> {
		const addressId = input._id;
		delete input._id;

		// Verify ownership
		const existing = await this.addressModel.findOne({ _id: addressId, memberId: memberId }).exec();
		if (!existing) throw new NotFoundException(Message.NO_DATA_FOUND);

		// If setting as default, unset other defaults
		if (input.isDefault) {
			await this.addressModel
				.updateMany({ memberId: memberId, isDefault: true, _id: { $ne: addressId } }, { isDefault: false })
				.exec();
		}

		const result = await this.addressModel.findByIdAndUpdate(addressId, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	// ! DELETE ADDRESS
	public async deleteAddress(memberId: ObjectId, addressId: ObjectId): Promise<Address> {
		const result = await this.addressModel.findOneAndDelete({ _id: addressId, memberId: memberId }).exec();
		if (!result) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result;
	}
}
