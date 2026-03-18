import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { graphqlUploadExpress } from 'graphql-upload';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { LoggingInterceptor } from './libs/interceptors/Loggin.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // strip properties without decorators
			forbidNonWhitelisted: true, // throw if unknown properties sent
			transform: true, // auto-transform primitives (string→number etc.)
		}),
	);
	app.useGlobalInterceptors(new LoggingInterceptor());
	// TODO production: replace origin with your actual domain(s)
	// e.g. origin: ['https://yourdomain.com']
	app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static('uploads'));
	app.useWebSocketAdapter(new IoAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
