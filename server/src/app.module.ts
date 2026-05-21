import { MiddlewareConsumer, Module, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import configuration from '../config';
import { dataSourceOptions } from '../database/data-source';
import { CustomResponseMiddleware, winstonLogger } from './common';
import {
    AgentsModule,
    AuthenticationModule,
    BookingsModule,
    GeminiModule,
    MatchingModule,
    NotificationsModule,
    PricingModule,
    ProvidersModule,
    RequestsModule,
    UsersModule,
} from './modules';

@Module({
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        },
    ],
    imports: [
        ConfigModule.forRoot({
            cache: true,
            isGlobal: true,
            load: [configuration],
        }),
        TypeOrmModule.forRoot(dataSourceOptions),
        WinstonModule.forRoot({
            instance: winstonLogger,
            transports: winstonLogger.transports,
        }),
        AgentsModule,
        AuthenticationModule,
        BookingsModule,
        GeminiModule,
        MatchingModule,
        NotificationsModule,
        PricingModule,
        ProvidersModule,
        RequestsModule,
        UsersModule,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(CustomResponseMiddleware)
            .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
    }
}
