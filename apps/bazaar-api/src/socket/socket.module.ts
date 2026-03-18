import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import ChatSchema from '../schemas/Chat.model';
import MemberSchema from '../schemas/Member.model';

@Module({
	imports: [
		AuthModule,
		MongooseModule.forFeature([
			{ name: 'Chat', schema: ChatSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class SocketModule {}
