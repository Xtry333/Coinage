import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiPathsModule } from '@coinage-app/router';
import ormconfig from 'apps/api/ormconfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [AppController],
    providers: [AppService, ApiPathsModule],
})
export class AppModule {}
