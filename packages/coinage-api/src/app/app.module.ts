import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import controllers from './controllers/_index';
import daos from './daos/_index';
import entities from './entities/_index';
import { EventsGateway } from './events/events.gateway';
import { ReceiptProcessingModule } from './receipt-processing/receipt-processing.module';
import services from './services/_index';
import { opts } from './typeorm.config';

@Module({
    imports: [
        HttpModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                ...opts,
                type: 'postgres' as const,
                host: config.get<string>('PG_HOST') || config.get<string>('MYSQL_HOST') || 'localhost',
                port: Number(config.get<string>('COINAGE_PG_PORT')) || Number(config.get<string>('COINAGE_MYSQL_PORT')) || 5432,
                username: config.get<string>('PG_USER') || config.get<string>('MYSQL_USER'),
                password: config.get<string>('PG_PASSWORD') || config.get<string>('MYSQL_PASSWORD'),
                database: config.get<string>('PG_DATABASE') || config.get<string>('MYSQL_DATABASE'),
            }),
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature(entities),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('COINAGE_API_JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
        ReceiptProcessingModule,
    ],
    controllers: [...controllers],
    providers: [...services, ...daos, EventsGateway],
})
export class AppModule {}
