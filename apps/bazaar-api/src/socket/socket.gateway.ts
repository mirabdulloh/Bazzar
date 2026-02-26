import { Logger } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger('SocketGateway');

	/** memberId (string) → active WebSocket */
	private readonly membersMap = new Map<string, WebSocket>();
	/** WebSocket → memberId (string) — for O(1) lookup in handleDisconnect */
	private readonly socketToMember = new Map<WebSocket, string>();

	constructor(private readonly authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit(): void {
		this.logger.verbose('WebSocket server initialized');
	}

	public async handleConnection(client: WebSocket, req: any): Promise<void> {
		try {
			const member = await this.retrieveAuth(req);

			if (member) {
				const memberId = member._id.toString();

				// Same member reconnects → terminate the stale socket first
				const existing = this.membersMap.get(memberId);
				if (existing && existing !== client) {
					this.socketToMember.delete(existing);
					existing.terminate();
					this.logger.verbose(`Replaced stale socket for ${member.memberNick}`);
				}

				this.membersMap.set(memberId, client);
				this.socketToMember.set(client, memberId);
				this.logger.verbose(`Connected: ${member.memberNick} [${memberId}] | online: ${this.server.clients.size}`);
			} else {
				this.logger.verbose(`Connected: Guest (unauthenticated) | online: ${this.server.clients.size}`);
			}
		} catch (err) {
			this.logger.error('handleConnection error', err);
		}
	}

	public handleDisconnect(client: WebSocket): void {
		const memberId = this.socketToMember.get(client);
		if (memberId) {
			this.membersMap.delete(memberId);
			this.socketToMember.delete(client);
			this.logger.verbose(`Disconnected: [${memberId}] | online: ${this.server.clients.size}`);
		}
	}

	/** Push an event to a specific member by their ObjectId string */
	public emitToUser(receiverId: string, event: string, data: unknown): void {
		const client = this.membersMap.get(receiverId);
		if (client?.readyState === WebSocket.OPEN) {
			try {
				client.send(JSON.stringify({ event, data }));
			} catch (err) {
				this.logger.error(`emitToUser failed for [${receiverId}]`, err);
				// Remove stale entries so they don't accumulate
				this.socketToMember.delete(client);
				this.membersMap.delete(receiverId);
			}
		}
	}

	/** Broadcast an event to all currently connected clients */
	public broadcast(event: string, data: unknown): void {
		const payload = JSON.stringify({ event, data });
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				try {
					client.send(payload);
				} catch (err) {
					this.logger.error('broadcast: one client send failed', err);
				}
			}
		});
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const { searchParams } = new URL(req.url, 'http://localhost');
			const token = searchParams.get('token');
			if (!token) return null;
			return await this.authService.verifyToken(token as string);
		} catch (err) {
			this.logger.verbose(`Auth failed: ${(err as Error).message}`);
			return null;
		}
	}
}
