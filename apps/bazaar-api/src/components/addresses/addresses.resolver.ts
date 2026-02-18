import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { Address } from '../../libs/dto/addresses/address';
import { AddressInput } from '../../libs/dto/addresses/address.input';
import { AddressUpdate } from '../../libs/dto/addresses/address.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class AddressesResolver {
	constructor(private readonly addressesService: AddressesService) {}

	// * MUTATIONS *

	// ! Create Address
	@UseGuards(AuthGuard)
	@Mutation(() => Address)
	public async createAddress(
		@Args('input') input: AddressInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Address> {
		console.log('Mutation: createAddress');
		input.memberId = memberId.toString();
		return await this.addressesService.createAddress(input);
	}

	// ! Update Address
	@UseGuards(AuthGuard)
	@Mutation(() => Address)
	public async updateAddress(
		@Args('input') input: AddressUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Address> {
		console.log('Mutation: updateAddress');
		return await this.addressesService.updateAddress(memberId, input);
	}

	// ! Delete Address
	@UseGuards(AuthGuard)
	@Mutation(() => Address)
	public async deleteAddress(
		@Args('addressId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Address> {
		console.log('Mutation: deleteAddress');
		const addressId = shapeIntoMongoObjectId(input);
		return await this.addressesService.deleteAddress(memberId, addressId);
	}

	// * QUERIES *

	// ! Get My Addresses
	@UseGuards(AuthGuard)
	@Query(() => [Address])
	public async getAddresses(@AuthMember('_id') memberId: ObjectId): Promise<Address[]> {
		console.log('Query: getAddresses');
		return await this.addressesService.getAddresses(memberId);
	}
}
