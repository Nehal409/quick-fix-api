import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, { cors: true });
    const config = app.get(ConfigService);

    app.setGlobalPrefix('api/v1');
    patchNestJsSwagger();

    if (process.env.NODE_ENV !== 'production') {
        const conf = new DocumentBuilder()
            .setTitle('QuickFix API')
            .setDescription(
                'AI Service Orchestrator for Informal Economy — Google Antigravity Hackathon',
            )
            .setVersion('0.1')
            .addBearerAuth({
                description: 'Enter: Bearer <JWT>',
                name: 'Authorization',
                bearerFormat: 'Bearer',
                scheme: 'Bearer',
                type: 'http',
                in: 'Header',
            })
            .build();

        const document = SwaggerModule.createDocument(app, conf);
        SwaggerModule.setup('api/v1/docs', app, document);
    }

    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    await app.listen(config.get<number>('port') ?? 3000);
}

bootstrap().catch((err) => {
    console.error('Application failed to start:', err);
    process.exit(1);
});
