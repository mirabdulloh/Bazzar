import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [AuthGuard] ---');

		const ctxType = context.getType<GqlContextType>();
		const request =
			ctxType === 'graphql'
				? GqlExecutionContext.create(context).getContext().req
				: context.switchToHttp().getRequest();

		const bearerToken = request?.headers?.authorization;
		if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

		const token = bearerToken.split(' ')[1];
		const authMember = await this.authService.verifyToken(token);
		if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		console.log('memberNick[auth] =>', authMember.memberNick);
		request.user = authMember;

		return true;
	}
}
