import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiPathsModule } from '@coinage-app/router';
import ormconfig from 'apps/api/ormconfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransfersController } from './controllers/transfers.controller';
import { TransferService } from './services/transfer.service';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [AppController, TransfersController],
    providers: [AppService, TransferService, ApiPathsModule],
})
export class AppModule {}
