import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { RequestIdMiddleware } from './common/http/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins.length ? allowedOrigins : false, credentials: true });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Nibras API listening on port ${port}`);
}
bootstrap();
