import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import controllers from './controllers/_index';
import daos from './daos/_index';
import entities from './entities/_index';
import { EventsGateway } from './events/events.gateway';
import services from './services/_index';
import { opts } from './typeorm.config';

@Module({
    imports: [
        HttpModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot(opts),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature(entities),
        JwtModule.register({
            secret: process.env.COINAGE_API_JWT_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [...controllers],
    providers: [...services, ...daos, EventsGateway],
})
export class AppModule {}
