/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';

declare const module: any;

async function bootstrap() {
    const globalPrefix = 'api';
    const port = process.env.PORT || 3333;
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
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
