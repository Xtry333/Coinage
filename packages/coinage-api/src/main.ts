/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { getApiPort } from './app/api-port';
import { AppModule } from './app/app.module';

async function bootstrap() {
    const globalPrefix = 'api';
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const port = getApiPort((name) => config.get<string>(name));

    app.use(helmet());
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(new ValidationPipe({ transform: true, forbidUnknownValues: false }));
    app.enableCors();
    await app.listen(port, () => {
        Logger.log(`🚀 Api is running on: http://localhost:${port}/${globalPrefix}`, 'ServerBootstrap');
    });
}

bootstrap();
