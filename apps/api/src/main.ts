/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

declare const module: any;

async function bootstrap() {
    const globalPrefix = 'api';
    const port = process.env.PORT || 3333;
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix(globalPrefix);
    app.enableCors();
    await app.listen(port, () => {
        Logger.log(`🚀 Api is running on: http://localhost:${port}/${globalPrefix}`, 'ServerBootstrap');
    });

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

bootstrap();
