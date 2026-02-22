import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/MessagesChat.model';
import { MessagesChatService } from './messages-chat.service';
import { MessagesChatResolver } from './messages-chat.resolver';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'MessageChat', schema: MessageSchema }]),
		AuthModule,
		ChatModule,
		SocketModule,
	],
	providers: [MessagesChatService, MessagesChatResolver],
	exports: [MessagesChatService],
})
export class MessagesChatModule {}
