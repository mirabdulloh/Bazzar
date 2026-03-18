import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Chat, ChatPresence, Chats } from '../../libs/dto/chat/chat';
import {
	ChatsInquiry,
	ChatsInquiryByAdmin,
	GetChatInput,
	OpenBrandChatInput,
	OpenSupportChatInput,
} from '../../libs/dto/chat/chat.input';
import { ChatUpdate } from '../../libs/dto/chat/chat.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ChatResolver {
	constructor(private readonly chatService: ChatService) {}

	@Roles(MemberType.USER)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async openOrGetBrandChat(
		@Args('input') input: OpenBrandChatInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Chat> {
		input.brandId = shapeIntoMongoObjectId(input.brandId);
		return await this.chatService.openOrGetBrandChat(memberId, input);
	}

	@Roles(MemberType.USER)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async openOrGetChat(
		@Args('input') input: OpenBrandChatInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Chat> {
		input.brandId = shapeIntoMongoObjectId(input.brandId);
		return await this.chatService.openOrGetBrandChat(memberId, input);
	}

	@Roles(MemberType.USER, MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async openOrGetSupportChat(
		@Args('input') input: OpenSupportChatInput,
		@AuthMember('_id') requesterId: ObjectId,
		@AuthMember('memberType') requesterType: MemberType,
	): Promise<Chat> {
		return await this.chatService.openOrGetSupportChat(requesterId, requesterType, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Chat)
	public async getChat(
		@Args('input') input: GetChatInput,
		@AuthMember('_id') viewerId: ObjectId,
		@AuthMember('memberType') viewerType: MemberType,
	): Promise<Chat> {
		input.chatId = shapeIntoMongoObjectId(input.chatId);
		return await this.chatService.getChat(input, viewerId, viewerType);
	}

	@UseGuards(AuthGuard)
	@Query(() => ChatPresence)
	public async getChatPresence(
		@Args('chatId') chatId: string,
		@AuthMember('_id') viewerId: ObjectId,
		@AuthMember('memberType') viewerType: MemberType,
	): Promise<ChatPresence> {
		return await this.chatService.getChatPresence(shapeIntoMongoObjectId(chatId), viewerId, viewerType);
	}

	@Roles(MemberType.USER)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getMyChats(@Args('input') input: ChatsInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Chats> {
		return await this.chatService.getMyChats(memberId, input);
	}

	@Roles(MemberType.USER, MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getMySupportChats(
		@Args('input') input: ChatsInquiry,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<Chats> {
		return await this.chatService.getMySupportChats(memberId, memberType, input);
	}

	@Roles(MemberType.BRAND)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getBrandChats(@Args('input') input: ChatsInquiry, @AuthMember('_id') brandId: ObjectId): Promise<Chats> {
		return await this.chatService.getBrandChats(brandId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Chat)
	public async deleteChat(
		@Args('chatId') chatId: string,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<Chat> {
		return await this.chatService.deleteChat(memberId, memberType, shapeIntoMongoObjectId(chatId));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Chat)
	public async closeChat(
		@Args('chatId') chatId: string,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<Chat> {
		return await this.chatService.closeChat(memberId, memberType, shapeIntoMongoObjectId(chatId));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Chat)
	public async markChatMessagesAsRead(
		@Args('chatId') chatId: string,
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<Chat> {
		return await this.chatService.markChatMessagesAsRead(shapeIntoMongoObjectId(chatId), memberId, memberType);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getMyUnreadChatCount(
		@AuthMember('_id') memberId: ObjectId,
		@AuthMember('memberType') memberType: MemberType,
	): Promise<number> {
		return await this.chatService.getMyUnreadChatCount(memberId, memberType);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async claimSupportChat(@Args('chatId') chatId: string, @AuthMember('_id') adminId: ObjectId): Promise<Chat> {
		return await this.chatService.claimSupportChat(adminId, shapeIntoMongoObjectId(chatId));
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getAdminSupportChats(
		@Args('input') input: ChatsInquiryByAdmin,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Chats> {
		return await this.chatService.getAdminSupportChats(adminId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Chats)
	public async getAllChatsByAdmin(
		@Args('input') input: ChatsInquiryByAdmin,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Chats> {
		return await this.chatService.getAllChatsByAdmin(adminId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Chat)
	public async updateChatByAdmin(
		@Args('input') input: ChatUpdate,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Chat> {
		input._id = shapeIntoMongoObjectId(input._id);
		if (input.assignedAdminId) input.assignedAdminId = shapeIntoMongoObjectId(input.assignedAdminId);
		return await this.chatService.updateChatByAdmin({ ...input, assignedAdminId: input.assignedAdminId }, adminId);
	}
}
