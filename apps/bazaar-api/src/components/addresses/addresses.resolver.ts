import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { Address, AddressesData } from '../../libs/dto/addresses/address';
import { AddressInput, AddressesInquiry } from '../../libs/dto/addresses/address.input';
import { AddressUpdate, AddressUpdateByAdmin } from '../../libs/dto/addresses/address.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class AddressesResolver {
	constructor(private readonly addressesService: AddressesService) {}

	// * USER MUTATIONS *

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

	// ! Update Address (user — content fields only, status blocked)
	@UseGuards(AuthGuard)
	@Mutation(() => Address)
	public async updateAddress(
		@Args('input') input: AddressUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Address> {
		console.log('Mutation: updateAddress');
		return await this.addressesService.updateAddress(memberId, input);
	}

	// ! Delete Address (soft delete)
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

	// * USER QUERIES *

	// ! Get My Addresses (ACTIVE only)
	@UseGuards(AuthGuard)
	@Query(() => [Address])
	public async getAddresses(@AuthMember('_id') memberId: ObjectId): Promise<Address[]> {
		console.log('Query: getAddresses');
		return await this.addressesService.getAddresses(memberId);
	}

	// * ADMIN QUERIES *

	// ! Get All Addresses By Admin (paginated + filters)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => AddressesData)
	public async getAllAddressesByAdmin(@Args('input') input: AddressesInquiry): Promise<AddressesData> {
		console.log('Query: getAllAddressesByAdmin');
		return await this.addressesService.getAllAddressesByAdmin(input);
	}

	// * ADMIN MUTATIONS *

	// ! Update Address By Admin (can change any field including status)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Address)
	public async updateAddressByAdmin(@Args('input') input: AddressUpdateByAdmin): Promise<Address> {
		console.log('Mutation: updateAddressByAdmin');
		return await this.addressesService.updateAddressByAdmin(input);
	}
}
