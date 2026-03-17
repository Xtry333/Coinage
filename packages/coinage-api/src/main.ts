import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

async function bootstrap() {
    const globalPrefix = 'api';
    const port = process.env.PORT || 8333;
    const app = await NestFactory.create(AppModule);

    app.use(helmet());
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidUnknownValues: false }));

    const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [`http://localhost:${port}`];
    app.enableCors({ origin: allowedOrigins, credentials: true });

    await app.listen(port, () => {
        Logger.log(`🚀 Api is running on: http://localhost:${port}/${globalPrefix}`, 'ServerBootstrap');
    });
}

bootstrap();
