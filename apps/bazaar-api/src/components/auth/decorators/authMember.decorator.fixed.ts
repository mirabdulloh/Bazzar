import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext) => {
	// Handle GraphQL context
	if (context.getType() === 'graphql') {
		const gqlContext = GqlExecutionContext.create(context);
		const ctx = gqlContext.getContext();
		const user = ctx.req.user;

		if (user) {
			// Optionally attach authorization header to user object
			user.authorization = ctx.req.headers?.authorization;
		}

		// Return specific field if requested, otherwise return entire user
		return user && data ? user[data] : user;
	}

	// Handle HTTP context
	const request = context.switchToHttp().getRequest();
	const user = request.user;

	if (user) {
		user.authorization = request.headers?.authorization;
	}

	return user && data ? user[data] : user;
});
