import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { traceId?: string }>();
    const response = context.getResponse<Response>();
    const traceId = request.traceId ?? randomUUID();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = status >= 500 ? 'حدث خطأ داخلي. استخدم رقم التتبع عند التواصل مع الدعم.' : details;
    this.logger.error(JSON.stringify({ traceId, status, method: request.method, path: request.url, error: exception instanceof Error ? exception.message : String(exception) }));
    response.status(status).json({ statusCode: status, message, traceId, timestamp: new Date().toISOString(), path: request.url });
  }
}
