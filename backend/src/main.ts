import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ForbiddenAuditFilter } from './filters/forbidden-audit.filter';
import { AuditLogsService } from './audit-logs/audit-logs.service';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Audit logging for 403 Forbidden errors
  const auditLogsService = app.get(AuditLogsService);
  app.useGlobalFilters(new ForbiddenAuditFilter(auditLogsService));

  // OpenAPI Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Film Production Management API')
    .setDescription(
      'Core Backend Infrastructure, Authorization, Location Bookings, and Fund Management',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend server successfully running on port ${port}`);
  console.log(
    `Swagger Documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
