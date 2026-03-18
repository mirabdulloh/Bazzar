import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { MessagesChatService } from './messages-chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { MessageChat, MessageChats } from '../../libs/dto/messages-chat/messages-chat';
import { MessagesInquiry, SendMessageInput } from '../../libs/dto/messages-chat/messages-chat.input';
import { MessageChatUpdate, RemoveMessageInput } from '../../libs/dto/messages-chat/messages-chat.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class MessagesChatResolver {
	constructor(private readonly messagesChatService: MessagesChatService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async sendMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') senderId: ObjectId,
		@AuthMember('memberType') senderType: MemberType,
	): Promise<MessageChat> {
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		if (input.replyToId) input.replyToId = shapeIntoMongoObjectId(input.replyToId);
		return await this.messagesChatService.sendMessage(senderId, senderType, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => MessageChats)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') userId: ObjectId,
		@AuthMember('memberType') userType: MemberType,
	): Promise<MessageChats> {
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messagesChatService.getMessages(userId, userType, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async updateMessageChat(
		@Args('input') input: MessageChatUpdate,
		@AuthMember('_id') senderId: ObjectId,
		@AuthMember('memberType') senderType: MemberType,
	): Promise<MessageChat> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.messagesChatService.updateMessageChat(senderId, senderType, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async removeMessageChat(
		@Args('input') input: RemoveMessageInput,
		@AuthMember('_id') senderId: ObjectId,
		@AuthMember('memberType') senderType: MemberType,
	): Promise<MessageChat> {
		return await this.messagesChatService.removeMessageChat(
			senderId,
			senderType,
			shapeIntoMongoObjectId(input.messageId),
			input.deleteForEveryone,
		);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => MessageChats)
	public async getAllMessagesByAdmin(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<MessageChats> {
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messagesChatService.getAllMessagesByAdmin(adminId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => MessageChat)
	public async removeMessageChatByAdmin(
		@Args('messageId') messageId: string,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<MessageChat> {
		return await this.messagesChatService.removeMessageChatByAdmin(adminId, shapeIntoMongoObjectId(messageId));
	}
}
