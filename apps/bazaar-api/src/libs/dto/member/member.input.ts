import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { availableAgentSorts, availableMemberSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class MemberInput {
	@IsNotEmpty()
	@IsString()
	@Length(3, 12)
	@Field(() => String)
	memberNick: string;

	@IsNotEmpty()
	@IsString()
	@Length(7, 20)
	@Field(() => String)
	memberPassword: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	memberPhone: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsEnum(MemberAuthType)
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;

	// ! For BRAND signups — logo image path uploaded before signup
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	brandLogo?: string;
}

@InputType()
export class LoginInput {
	@IsNotEmpty()
	@IsString()
	@Length(3, 12)
	@Field(() => String)
	memberNick: string;

	@IsNotEmpty()
	@IsString()
	@Length(7, 20)
	@Field(() => String)
	memberPassword: string;
}

@InputType()
class AISearch {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AgentsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableAgentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search: AISearch;
}

@InputType()
class BISearch {
	@IsOptional()
	@IsEnum(MemberStatus)
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class BrandInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableAgentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => BISearch)
	search: BISearch;
}

@InputType()
class MISearch {
	@IsOptional()
	@IsEnum(MemberStatus)
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class MembersInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableMemberSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => MISearch, { nullable: true })
	search?: MISearch;
}

@InputType()
export class ChangePasswordInput {
	@IsNotEmpty()
	@IsString()
	@Length(8, 20)
	@Field(() => String)
	oldPassword: string;

	@IsNotEmpty()
	@IsString()
	@Length(8, 20)
	@Field(() => String)
	newPassword: string;
}
