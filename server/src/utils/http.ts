import { Response } from 'express';

export const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, message });

export const requireId = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A valid id is required.');
  return value;
};
