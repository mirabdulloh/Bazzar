import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeResolver } from './notice.resolver';
import { NoticeService } from './notice.service';
import NoticeSchema from '../../schemas/Notices.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Notice', schema: NoticeSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		MailModule,
	],
	providers: [NoticeResolver, NoticeService],
})
export class NoticeModule {}
