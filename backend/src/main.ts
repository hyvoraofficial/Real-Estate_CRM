import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('vercel.app') ||
        origin.includes('hyvorademo.in') ||
        (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const config = new DocumentBuilder()
    .setTitle('HYVORA Real Estate CRM API')
    .setDescription('Backend REST API for HYVORA Real Estate CRM')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 HYVORA Real Estate CRM API is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
