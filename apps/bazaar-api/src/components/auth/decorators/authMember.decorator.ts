import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext) => {
	if (context.getType<GqlContextType>() === 'graphql') {
		const gqlContext = GqlExecutionContext.create(context);
		const ctx = gqlContext.getContext();
		const user = ctx.req.user;

		if (user) {
			user.authorization = ctx.req.headers?.authorization;
		}

		return user && data ? user[data] : user;
	}

	const request = context.switchToHttp().getRequest();
	const user = request.user;

	if (user) {
		user.authorization = request.headers?.authorization;
	}

	return user && data ? user[data] : user;
});
