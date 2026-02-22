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
import * as url from 'url';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger('SocketGateway');

	/** memberId (string) → active WebSocket */
	private clientsMap = new Map<string, WebSocket>();

	constructor(private readonly authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit() {
		this.logger.verbose('WebSocket server initialized');
	}

	public async handleConnection(client: WebSocket, req: any) {
		const member = await this.retrieveAuth(req);
		if (member) {
			this.clientsMap.set(member._id.toString(), client);
			this.logger.verbose(`Connected: ${member.memberNick} [${member._id}]`);
		} else {
			this.logger.verbose('Connected: Guest (unauthenticated)');
		}

		// Clean up map when socket closes
		client.on('close', () => {
			if (member) {
				this.clientsMap.delete(member._id.toString());
				this.logger.verbose(`Disconnected: ${member.memberNick} [${member._id}]`);
			}
		});
	}

	public handleDisconnect(_client: WebSocket) {
		// Lifecycle cleanup handled in handleConnection's 'close' event above
	}

	/** Push a notification event to a specific member by their ObjectId string */
	public emitToUser(receiverId: string, event: string, data: unknown): void {
		const client = this.clientsMap.get(receiverId);
		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ event, data }));
		}
	}

	/** Broadcast an event to all currently connected clients */
	public broadcast(event: string, data: unknown): void {
		const payload = JSON.stringify({ event, data });
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(payload);
			}
		});
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parsed = url.parse(req.url, true);
			const { token } = parsed.query;
			if (!token) return null;
			return await this.authService.verifyToken(token as string);
		} catch {
			return null;
		}
	}
}
