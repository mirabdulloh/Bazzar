import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { JwtService } from '@nestjs/jwt';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}
	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt(12);
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const doc = member['_doc'] ? member['_doc'] : member;
		const payload: T = {
			_id: doc._id,
			memberType: doc.memberType,
			memberStatus: doc.memberStatus,
		};
		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verify(token);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}

	public createRefreshToken(memberId: string): string {
		return this.jwtService.sign(
			{ _id: memberId },
			{ secret: process.env.REFRESH_TOKEN_SECRET, expiresIn: '7d' },
		);
	}

	public verifyRefreshToken(token: string): { _id: string } {
		return this.jwtService.verify<{ _id: string }>(token, {
			secret: process.env.REFRESH_TOKEN_SECRET,
		});
	}
}
