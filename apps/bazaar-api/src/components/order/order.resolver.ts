import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrdersData } from '../../libs/dto/order/order';
import { CreateOrderInput, MyOrdersInquiry, AllOrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderUpdate } from '../../libs/dto/order/order.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class OrderResolver {
	constructor(private readonly orderService: OrderService) {}

	// * MUTATIONS *

	// ! Create Order
	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async createOrder(
		@Args('input') input: CreateOrderInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Order> {
		return await this.orderService.createOrder(memberId, input);
	}

	// ! Update Order By Admin
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Order)
	public async updateOrderByAdmin(@Args('input') input: OrderUpdate): Promise<Order> {
		return await this.orderService.updateOrderByAdmin(input);
	}

	// * QUERIES *

	// ! Get Single Order
	@UseGuards(AuthGuard)
	@Query(() => Order)
	public async getOrder(@Args('orderId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Order> {
		const orderId = shapeIntoMongoObjectId(input);
		return await this.orderService.getOrder(memberId, orderId);
	}

	// ! Get My Orders
	@UseGuards(AuthGuard)
	@Query(() => OrdersData)
	public async getMyOrders(
		@Args('input') input: MyOrdersInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<OrdersData> {
		return await this.orderService.getMyOrders(memberId, input);
	}

	// ! Get All Orders By Admin
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => OrdersData)
	public async getAllOrdersByAdmin(@Args('input') input: AllOrdersInquiry): Promise<OrdersData> {
		return await this.orderService.getAllOrdersByAdmin(input);
	}
}
