import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NoticeCategory, NoticeStatus } from '../../enums/notices.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	noticeTitle: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	noticeContent: string;

	@IsOptional()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}
