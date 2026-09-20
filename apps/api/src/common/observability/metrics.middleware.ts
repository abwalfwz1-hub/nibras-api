import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { recordRequest } from './metrics';
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(_request: Request, response: Response, next: NextFunction) { const started = Date.now(); response.on('finish', () => recordRequest(Date.now() - started, response.statusCode)); next(); }
}
