import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.name === 'AppError') {
    const appErr = err as AppError;
    return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  if (err.name === 'ZodError') {
    return res.status(422).json({ success: false, error: 'Validation error', details: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
};
