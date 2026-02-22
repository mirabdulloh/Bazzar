import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Member, MembersData } from '../../libs/dto/member/member';
import {
	BrandInquiry,
	ChangePasswordInput,
	LoginInput,
	MemberInput,
	MembersInquiry,
} from '../../libs/dto/member/member.input';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberUpdate, MemberUpdateByAdmin } from '../../libs/dto/member/member.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes, allowedUploadTargets } from '../../libs/config';
import { Message } from '../../libs/enums/common.enum';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream, mkdirSync } from 'fs';
import { ObjectId } from 'mongoose';

@Resolver()
export class MemberResolver {
	private readonly logger = new Logger(MemberResolver.name);

	constructor(private readonly memberService: MemberService) {}

	// ! Sign Up
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		this.logger.log('Mutation: signup');
		return this.memberService.signup(input);
	}

	// ! Login
	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		this.logger.log('Mutation: login');
		return this.memberService.login(input);
	}

	// ! Refresh Token
	@Mutation(() => Member)
	public async refreshToken(@Args('refreshToken') refreshToken: string): Promise<Member> {
		console.log('Mutation: refreshToken');
		return this.memberService.refreshAccessToken(refreshToken);
	}

	// ! Logout
	@Mutation(() => Boolean)
	@UseGuards(AuthGuard)
	public async logout(@AuthMember('_id') memberId: string): Promise<boolean> {
		console.log('Mutation: logout');
		return this.memberService.logout(memberId);
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

	// * QUERIES *

	// ! Get Members List [BRANDS]
	@UseGuards(WithoutGuard)
	@Query(() => MembersData)
	public async getBrands(
		@Args('input') input: BrandInquiry,
		@AuthMember('_id') memberId?: ObjectId,
	): Promise<MembersData> {
		console.log('Query: getBrands');
		return await this.memberService.getBrands(memberId ?? null, input);
	}

	// ! Get Single Member
	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(@Args('memberId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Member> {
		console.log('Query: getMember');
		const targetId = shapeIntoMongoObjectId(input);
		return this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => MembersData)
	public async getMembers(@Args('input') input: MembersInquiry): Promise<MembersData> {
		console.log('Query: getMembers');
		return this.memberService.getMembers(input);
	}

	// ! Like Target Member (Brand)
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: likeTargetMember');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}
	// ! Admin: Update Member (can update any field including status)
	@Mutation(() => Member)
	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	public async updateMemberByAdmin(@Args('input') input: MemberUpdateByAdmin): Promise<Member> {
		console.log('Mutation: updateMemberByAdmin');
		return this.memberService.updateMemberByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => MembersData)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<MembersData> {
		console.log('Query: getMembersByAdmin');

		return await this.memberService.getAllMembersByAdmin(input);
	}

	// ! IMG UPLOADERS

	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		{ createReadStream, filename, mimetype }: FileUpload,
		@Args('target') target: string,
	): Promise<string> {
		console.log('Mutation: imageUploader');

		if (!filename) throw new Error(Message.UPLOAD_FAILED);
		if (!allowedUploadTargets.includes(target)) throw new Error(Message.BAD_REQUEST);
		const validMime = validMimeTypes.includes(mimetype);
		if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

		const imageName = getSerialForImage(filename);
		const dir = `uploads/${target}`;
		mkdirSync(dir, { recursive: true });
		const url = `${dir}/${imageName}`;
		const stream = createReadStream();

		const result = await new Promise((resolve, reject) => {
			stream
				.pipe(createWriteStream(url))
				.on('finish', async () => resolve(true))
				.on('error', () => reject(false));
		});
		if (!result) throw new Error(Message.UPLOAD_FAILED);

		return url;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: string,
	): Promise<string[]> {
		console.log('Mutation: imagesUploader');
		if (!allowedUploadTargets.includes(target)) throw new Error(Message.BAD_REQUEST);

		const uploadedImages = [];
		const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<void> => {
			try {
				const { filename, mimetype, createReadStream } = await img;

				const validMime = validMimeTypes.includes(mimetype);
				if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

				const imageName = getSerialForImage(filename);
				const dir = `uploads/${target}`;
				mkdirSync(dir, { recursive: true });
				const url = `${dir}/${imageName}`;
				const stream = createReadStream();

				const result = await new Promise((resolve, reject) => {
					stream
						.pipe(createWriteStream(url))
						.on('finish', () => resolve(true))
						.on('error', () => reject(false));
				});
				if (!result) throw new Error(Message.UPLOAD_FAILED);

				uploadedImages[index] = url;
			} catch (err) {
				console.log('Error, imagesUploader:', err.message);
			}
		});

		await Promise.all(promisedList);
		return uploadedImages;
	}
}
