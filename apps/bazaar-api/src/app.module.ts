import * as depthLimit from 'graphql-depth-limit';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SocketModule } from './socket/socket.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			csrfPrevention: true,
			validationRules: [depthLimit(7)],
			formatError: (error: T) => {
				const graphQLFormattedError = {
					code: error?.extensions?.code,
					message:
						error?.extensions?.exceptions?.response?.message || error?.extensions?.response?.message || error?.message,
				};
				return graphQLFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
