import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error caught in middleware:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(status).json({
    success: false,
    message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}
