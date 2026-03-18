import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../components/auth/auth.service';
import { ChatScope } from '../libs/enums/chat.enum';
import { MemberType } from '../libs/enums/member.enum';
import { Member } from '../libs/dto/member/member';
import { T } from '../libs/types/common';

@WebSocketGateway({
	namespace: '/chat',
	cors: {
		origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((item) => item.trim()) : true,
		credentials: true,
	},
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger('SocketGateway');
	private readonly authTimers = new Map<string, NodeJS.Timeout>();
	private readonly socketToUser = new Map<string, string>();
	private readonly userSocketMap = new Map<string, Set<string>>();

	constructor(
		private readonly authService: AuthService,
		@InjectModel('Chat') private readonly chatModel: Model<T>,
		@InjectModel('Member') private readonly memberModel: Model<T>,
	) {}

	@WebSocketServer()
	server: Server;

	public afterInit(): void {
		this.logger.verbose('Chat socket gateway initialized');
	}

	public async handleConnection(client: Socket): Promise<void> {
		const token = this.extractToken(client);
		if (token) {
			const member = await this.verifyMember(token);
			if (member) {
				await this.registerSession(client, member);
				client.emit('authenticated', { userId: member._id.toString(), memberType: member.memberType });
				return;
			}
		}

		const timeout = setTimeout(() => {
			if (!this.socketToUser.has(client.id)) {
				client.emit('socketError', { message: 'Authentication required.' });
				client.disconnect(true);
			}
		}, 5000);

		this.authTimers.set(client.id, timeout);
	}

	public handleDisconnect(client: Socket): void {
		const timer = this.authTimers.get(client.id);
		if (timer) {
			clearTimeout(timer);
			this.authTimers.delete(client.id);
		}

		const memberId = this.socketToUser.get(client.id);
		if (!memberId) return;

		this.socketToUser.delete(client.id);
		const socketIds = this.userSocketMap.get(memberId);
		if (!socketIds) return;
		socketIds.delete(client.id);
		if (!socketIds.size) {
			this.userSocketMap.delete(memberId);
			void this.touchMemberActivity(memberId);
		}
	}

	@SubscribeMessage('authenticate')
	public async authenticate(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { token?: string },
	): Promise<void> {
		const token = payload?.token;
		if (!token) {
			client.emit('socketError', { message: 'Authentication token is required.' });
			return;
		}

		const member = await this.verifyMember(token);
		if (!member) {
			client.emit('socketError', { message: 'Authentication failed.' });
			client.disconnect(true);
			return;
		}

		await this.registerSession(client, member);
		client.emit('authenticated', { userId: member._id.toString(), memberType: member.memberType });
	}

	@SubscribeMessage('joinChat')
	public async joinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId?: string }): Promise<void> {
		const member = client.data.member as Member | undefined;
		const chatId = payload?.chatId;
		if (!member || !chatId) {
			client.emit('socketError', { message: 'Join chat failed.' });
			return;
		}

		const chat = await this.chatModel.findById(chatId).lean().exec();
		if (!chat || !this.canAccessChat(chat, member)) {
			client.emit('socketError', { message: 'Not allowed to join this chat.' });
			return;
		}

		await client.join(this.chatRoom(chatId));
		client.emit('joinedChat', { chatId });
	}

	@SubscribeMessage('leaveChat')
	public async leaveChat(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId?: string }): Promise<void> {
		const chatId = payload?.chatId;
		if (!chatId) return;
		await client.leave(this.chatRoom(chatId));
		client.emit('leftChat', { chatId });
	}

	@SubscribeMessage('typing')
	public async typing(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId?: string }): Promise<void> {
		const member = client.data.member as Member | undefined;
		const chatId = payload?.chatId;
		if (!member || !chatId) return;

		const room = this.chatRoom(chatId);
		if (!client.rooms.has(room)) return;

		client.to(room).emit('userTyping', {
			chatId,
			memberId: member._id.toString(),
			memberType: member.memberType,
		});
	}

	@SubscribeMessage('stopTyping')
	public async stopTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId?: string }): Promise<void> {
		const member = client.data.member as Member | undefined;
		const chatId = payload?.chatId;
		if (!member || !chatId) return;

		const room = this.chatRoom(chatId);
		if (!client.rooms.has(room)) return;

		client.to(room).emit('userStopTyping', {
			chatId,
			memberId: member._id.toString(),
			memberType: member.memberType,
		});
	}

	public emitToUser(receiverId: string, event: string, data: unknown): void {
		this.server.to(this.userRoom(receiverId)).emit(event, data);
	}

	public emitToUsers(receiverIds: string[], event: string, data: unknown, excludedUserId?: string): void {
		[...new Set(receiverIds)].forEach((receiverId) => {
			if (receiverId !== excludedUserId) this.emitToUser(receiverId, event, data);
		});
	}

	public emitNewMessage(chatId: string, receiverIds: string[], data: unknown, excludedUserId?: string): void {
		this.server.to(this.chatRoom(chatId)).emit('newMessage', data);
		this.emitToUsers(receiverIds, 'chatListUpdated', { chatId }, excludedUserId);
	}

	public emitMessagesRead(chatId: string, receiverIds: string[], data: unknown, excludedUserId?: string): void {
		this.server.to(this.chatRoom(chatId)).emit('messagesRead', data);
		this.emitToUsers(receiverIds, 'chatListUpdated', { chatId }, excludedUserId);
	}

	public emitChatClaimed(chatId: string, receiverIds: string[], data: unknown): void {
		this.server.to(this.chatRoom(chatId)).emit('chatClaimed', data);
		this.emitToUsers(receiverIds, 'chatListUpdated', { chatId, ...(data as object) });
	}

	public emitChatClosed(chatId: string, receiverIds: string[], data: unknown): void {
		this.server.to(this.chatRoom(chatId)).emit('chatClosed', data);
		this.emitToUsers(receiverIds, 'chatListUpdated', { chatId, ...(data as object) });
	}

	public emitChatListUpdated(receiverIds: string[], data: unknown): void {
		this.emitToUsers(receiverIds, 'chatListUpdated', data);
	}

	public isUserOnline(memberId: string): boolean {
		return Boolean(this.userSocketMap.get(memberId)?.size);
	}

	private extractToken(client: Socket): string | null {
		const authToken = client.handshake.auth?.token;
		if (typeof authToken === 'string' && authToken.trim()) return authToken;

		const queryToken = client.handshake.query?.token;
		if (typeof queryToken === 'string' && queryToken.trim()) return queryToken;

		return null;
	}

	private async verifyMember(token: string): Promise<Member | null> {
		try {
			return await this.authService.verifyToken(token);
		} catch (error) {
			this.logger.verbose(`Chat socket auth failed: ${(error as Error).message}`);
			return null;
		}
	}

	private async registerSession(client: Socket, member: Member): Promise<void> {
		const memberId = member._id.toString();
		const timer = this.authTimers.get(client.id);
		if (timer) {
			clearTimeout(timer);
			this.authTimers.delete(client.id);
		}

		client.data.member = member;
		this.socketToUser.set(client.id, memberId);
		const userSockets = this.userSocketMap.get(memberId) ?? new Set<string>();
		userSockets.add(client.id);
		this.userSocketMap.set(memberId, userSockets);
		await client.join(this.userRoom(memberId));
		await this.touchMemberActivity(memberId);
		this.logger.verbose(`Chat socket authenticated: ${member.memberNick} [${memberId}]`);
	}

	private async touchMemberActivity(memberId: string): Promise<void> {
		await this.memberModel
			.updateOne({ _id: memberId }, { $set: { lastActiveAt: new Date() } })
			.exec()
			.catch(() => {});
	}

	private canAccessChat(chat: T, member: Member): boolean {
		const memberId = member._id.toString();
		if (chat.requesterId?.toString() === memberId) return true;

		if (
			chat.chatScope === ChatScope.BRAND_DIRECT &&
			member.memberType === MemberType.BRAND &&
			chat.brandId?.toString() === memberId
		) {
			return true;
		}

		return chat.chatScope === ChatScope.ADMIN_SUPPORT && member.memberType === MemberType.ADMIN;
	}

	private userRoom(memberId: string): string {
		return `user:${memberId}`;
	}

	private chatRoom(chatId: string): string {
		return `chat:${chatId}`;
	}
}
