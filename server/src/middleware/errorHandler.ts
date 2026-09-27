import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

  if (error instanceof ZodError || error?.name === 'ZodError') {
    const message = error.issues?.[0]?.message || 'Validation failed. Please check your request parameters.';
    return res.status(400).json({
      success: false,
      message,
      errors: error.issues?.map((issue: any) => ({
        field: issue.path?.join('.'),
        message: issue.message
      }))
    });
  }

  const statusCode = error?.statusCode || error?.status || 500;
  const message = statusCode >= 500
    ? 'An unexpected error occurred. Please try again later.'
    : error?.message || 'Request failed.';

  if (statusCode >= 500) {
    console.error('Unhandled server error:', error);
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
}
