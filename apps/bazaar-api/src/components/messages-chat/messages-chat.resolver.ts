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
import { SendMessageInput, MessagesInquiry } from '../../libs/dto/messages-chat/messages-chat.input';
import { MessageChatUpdate } from '../../libs/dto/messages-chat/messages-chat.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class MessagesChatResolver {
	constructor(private readonly messagesChatService: MessagesChatService) {}

	/** USER / BRAND */

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async sendMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') senderId: ObjectId,
	): Promise<MessageChat> {
		console.log('Mutation: sendMessage');
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messagesChatService.sendMessage(senderId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => MessageChats)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') userId: ObjectId,
	): Promise<MessageChats> {
		console.log('Query: getMessages');
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messagesChatService.getMessages(userId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async updateMessageChat(
		@Args('input') input: MessageChatUpdate,
		@AuthMember('_id') senderId: ObjectId,
	): Promise<MessageChat> {
		console.log('Mutation: updateMessageChat');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.messagesChatService.updateMessageChat(senderId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageChat)
	public async removeMessageChat(
		@Args('messageId') messageId: string,
		@AuthMember('_id') senderId: ObjectId,
	): Promise<MessageChat> {
		console.log('Mutation: removeMessageChat');
		const id = shapeIntoMongoObjectId(messageId);
		return await this.messagesChatService.removeMessageChat(senderId, id);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => MessageChats)
	public async getAllMessagesByAdmin(@Args('input') input: MessagesInquiry): Promise<MessageChats> {
		console.log('Query: getAllMessagesByAdmin');
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messagesChatService.getAllMessagesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => MessageChat)
	public async removeMessageChatByAdmin(@Args('messageId') messageId: string): Promise<MessageChat> {
		console.log('Mutation: removeMessageChatByAdmin');
		const id = shapeIntoMongoObjectId(messageId);
		return await this.messagesChatService.removeMessageChatByAdmin(id);
	}
}
