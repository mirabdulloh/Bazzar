import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Chat, Chats } from '../../libs/dto/chat/chat';
import { OpenChatInput, ChatsInquiry } from '../../libs/dto/chat/chat.input';
import { ChatUpdate } from '../../libs/dto/chat/chat.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ChatResolver {
	constructor(private readonly chatService: ChatService) {}

	/** USER */

	@UseGuards(AuthGuard)
	@Mutation(() => Chat)
	public async openOrGetChat(
		@Args('input') input: OpenChatInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Chat> {
		console.log('Mutation: openOrGetChat');
		input.brandId = shapeIntoMongoObjectId(input.brandId);
		return await this.chatService.openOrGetChat(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Chats)
	public async getMyChats(
		@Args('input') input: ChatsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Chats> {
		console.log('Query: getMyChats');
		return await this.chatService.getMyChats(memberId, input);
	}

	/** BRAND */

	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getBrandChats(
		@Args('input') input: ChatsInquiry,
		@AuthMember('_id') brandId: ObjectId,
	): Promise<Chats> {
		console.log('Query: getBrandChats');
		return await this.chatService.getBrandChats(brandId, input);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getAllChatsByAdmin(@Args('input') input: ChatsInquiry): Promise<Chats> {
		console.log('Query: getAllChatsByAdmin');
		return await this.chatService.getAllChatsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async updateChatByAdmin(@Args('input') input: ChatUpdate): Promise<Chat> {
		console.log('Mutation: updateChatByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.chatService.updateChatByAdmin(input);
	}
}
