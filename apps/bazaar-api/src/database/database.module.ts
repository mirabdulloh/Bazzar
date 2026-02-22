import { Logger, Module } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => ({
				uri: process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV,
			}),
		}),
	],
	providers: [MongooseModule],
})
export class DatabaseModule {
	constructor(@InjectConnection() private readonly connection: Connection) {
		if (connection.readyState === 1) {
			Logger.log(`Mongo DB connected into ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`, 'DatabaseModule');
		} else {
			Logger.warn('MongoDB is not connected!', 'DatabaseModule');
		}
	}
}
