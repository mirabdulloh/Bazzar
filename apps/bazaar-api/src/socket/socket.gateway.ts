// import { Logger } from '@nestjs/common';
// import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { Server, WebSocket } from 'ws';
// import { AuthService } from '../components/auth/auth.service';
// import { Member } from '../libs/dto/member/member';

// import * as url from 'url';
// interface MessagePayload {
// 	event: string;
// 	text: string;
// 	memberData?: Member | null;
// }
// interface InfoPayload {
// 	event: string;
// 	totalClients: number;
// 	memberData?: Member | null;
// 	action: string;
// }

// @WebSocketGateway({ transports: ['websocket'], secundifinedre: false })
// export class SocketGateway implements OnGatewayInit {
// 	private logger: Logger = new Logger('SocketEventsGateway');
// 	private summaryClient: number = 0;
// 	private clientAuthMap = new Map<WebSocket, Member | null>();
// 	private messageList: MessagePayload[] = [];
// 	constructor(private authService: AuthService) {}
// 	@WebSocketServer()
// 	server: Server;
// 	public afterInit(server: any) {
// 		this.logger.verbose(`WebSocket server Initialized & total [${this.summaryClient}]`);
// 	}
// 	private async retrieveAuth(req: any): Promise<Member | null> {
// 		try {
// 			const parseUrl = url.parse(req.url, true);
// 			const { token } = parseUrl.query;
// 			return await this.authService.verifyToken(token as string);
// 		} catch (err) {
// 			return null;
// 		}
// 	}
// 	public async handleConnection(client: WebSocket, req: any) {
// 		const authMember = await this.retrieveAuth(req);
// 		console.log(authMember);
// 		this.summaryClient++;
// 		this.clientAuthMap.set(client, authMember);

// 		const clientNick: string = authMember?.memberNick ?? 'Guest';
// 		this.logger.verbose(` Connection [${clientNick}] & total [${this.summaryClient} ]`);

// 		const infoMsg: InfoPayload = {
// 			event: 'info',
// 			totalClients: this.summaryClient,
// 			memberData: authMember,
// 			action: 'joined',
// 		};
// 		this.emitMessage(infoMsg);

// 		client.send(JSON.stringify({ event: 'message', list: this.messageList }));
// 	}
// 	public handleDisconnect(client: WebSocket) {
// 		const authMember = this.clientAuthMap.get(client);
// 		this.summaryClient--;
// 		this.clientAuthMap.delete(client);
// 		const clientNick: string = authMember?.memberNick ?? 'Guest';
// 		this.logger.verbose(` Disconnection [${clientNick} & total[${this.summaryClient}] `);
// 		const infoMsg: InfoPayload = {
// 			event: 'info',
// 			totalClients: this.summaryClient,
// 			memberData: authMember,
// 			action: 'left',
// 		};

// 		this.broadCastMessage(client, infoMsg);
// 	}
// 	@SubscribeMessage('message')
// 	public async handleMessage(client: any, payload: any): Promise<void> {
// 		const authMember = this.clientAuthMap.get(client);
// 		const newMessage: MessagePayload = { event: 'message', text: payload, memberData: authMember };
// 		const clientNick: string = authMember?.memberNick ?? 'Guest';

// 		this.logger.verbose(`NEW MESSAGE [${clientNick}] : ${payload}`);

// 		this.messageList.push(newMessage);

// 		if (this.messageList.length >= 5) this.messageList.splice(0, this.messageList.length - 5);

// 		this.emitMessage(newMessage);
// 	}
// 	private broadCastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
// 		this.server.clients.forEach((client) => {
// 			if (client !== sender && client.readyState === WebSocket.OPEN) {
// 				client.send(JSON.stringify(message));
// 			}
// 		});
// 	}

// 	private emitMessage(message: InfoPayload | MessagePayload) {
// 		this.server.clients.forEach((client) => {
// 			if (client.readyState === WebSocket.OPEN) {
// 				client.send(JSON.stringify(message));
// 			}
// 		});
// 	}
// }

// /*
// MESSAGE TARGT:
// 1.CLIENT(only client)
// 2.BROADCAST(except client)
// 3.Emit(all clients)
// */
