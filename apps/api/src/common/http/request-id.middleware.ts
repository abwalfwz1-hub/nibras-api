import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

type TracedRequest = Request & { traceId?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: TracedRequest, response: Response, next: NextFunction) {
    const traceId = typeof request.header('x-request-id') === 'string' && request.header('x-request-id')!.length < 100 ? request.header('x-request-id')! : randomUUID();
    request.traceId = traceId;
    response.setHeader('x-request-id', traceId);
    next();
  }
}
