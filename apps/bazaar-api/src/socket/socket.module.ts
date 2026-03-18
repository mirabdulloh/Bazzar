import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import ChatSchema from '../schemas/Chat.model';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([{ name: 'Chat', schema: ChatSchema }])],
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class SocketModule {}
