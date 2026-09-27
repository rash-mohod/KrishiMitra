import crypto from 'node:crypto';
import { ENV } from './config/env.js';

const API = 'https://api.razorpay.com/v1';

function authHeader() {
  if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured.');
  }
  return 'Basic ' + Buffer.from(`${ENV.RAZORPAY_KEY_ID}:${ENV.RAZORPAY_KEY_SECRET}`).toString('base64');
}

async function razorpayRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', authHeader());
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.description || body?.error?.reason || `Razorpay request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  return razorpayRequest<{ id: string; amount: number; currency: string; status: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt, notes })
  });
}

export async function getRazorpayPayment(paymentId: string) {
  return razorpayRequest<{ id: string; order_id: string; amount: number; currency: string; status: string }>('/payments/' + encodeURIComponent(paymentId));
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', ENV.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!ENV.RAZORPAY_WEBHOOK_SECRET) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured.');
  const expected = crypto.createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
