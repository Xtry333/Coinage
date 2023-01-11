import { EventsGateway } from './events/events.gateway';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import controllers from './controllers/_index';
import daos from './daos/_index';
import entities from './entities/_index';
import services from './services/_index';
import { opts } from './typeorm.config';

@Module({
    imports: [TypeOrmModule.forRoot(opts), ScheduleModule.forRoot(), TypeOrmModule.forFeature(entities)],
    controllers: controllers,
    providers: [...services, ...daos, EventsGateway],
})
export class AppModule {}
