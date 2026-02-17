import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NoticeCategory, NoticeStatus } from '../../enums/notices.enum';

@InputType()
export class NoticeUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	noticeContent?: string;

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
