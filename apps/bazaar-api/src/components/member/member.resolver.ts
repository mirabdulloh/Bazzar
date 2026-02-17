import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Member, MembersData } from '../../libs/dto/member/member';
import { ChangePasswordInput, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	// * MUTATIONS *

	// ! Sign Up
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return this.memberService.signup(input);
	}

	// ! Login
	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return this.memberService.login(input);
	}

	// ! Update Member Profile
	@Mutation(() => Member)
	@UseGuards(AuthGuard)
	public async updateMember(@Args('input') input: MemberUpdate, @AuthMember('_id') memberId: string): Promise<Member> {
		console.log('Mutation: updateMember');
		return this.memberService.updateMember(memberId, input);
	}

	// ! Change Password
	@Mutation(() => Member)
	@UseGuards(AuthGuard)
	public async changePassword(
		@Args('input') input: ChangePasswordInput,
		@AuthMember('_id') memberId: string,
	): Promise<Member> {
		console.log('Mutation: changePassword');
		return this.memberService.changePassword(memberId, input);
	}

	// ! Admin: Update Member (can update any field including status)
	@Mutation(() => Member)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	public async updateMemberByAdmin(
		@Args('memberId') memberId: string,
		@Args('input') input: MemberUpdate,
	): Promise<Member> {
		console.log('Mutation: updateMemberByAdmin');
		return this.memberService.updateMemberByAdmin(memberId, input);
	}

	// * QUERIES *

	// ! Get Members List
	@Query(() => MembersData)
	public async getMembers(@Args('input') input: MembersInquiry): Promise<MembersData> {
		console.log('Query: getMembers');
		return this.memberService.getMembers(input);
	}

	// ! Get Single Member
	@Query(() => Member)
	public async getMember(@Args('memberId') memberId: string): Promise<Member> {
		console.log('Query: getMember');
		return this.memberService.getMember(memberId);
	}

	// ! Get My Profile (Authenticated User)
	@Query(() => Member)
	@UseGuards(AuthGuard)
	public async getMyProfile(@AuthMember('_id') memberId: string): Promise<Member> {
		console.log('Query: getMyProfile');
		return this.memberService.getMember(memberId);
	}
}
