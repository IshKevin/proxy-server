import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { HTTP_STATUS } from '../config/constants';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response
 ): void {
  logger.error('Express error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}