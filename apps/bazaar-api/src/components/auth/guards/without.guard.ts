import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctxType = context.getType<GqlContextType>();
		const request =
			ctxType === 'graphql'
				? GqlExecutionContext.create(context).getContext().req
				: context.switchToHttp().getRequest();
		const bearerToken = request?.headers?.authorization;

		if (bearerToken) {
			try {
				const token = bearerToken.split(' ')[1];
				const authMember = await this.authService.verifyToken(token);
				request.user = authMember;
			} catch (err) {
				request.user = null;
			}
		} else {
			request.user = null;
		}

		return true;
	}
}
