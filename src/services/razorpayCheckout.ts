import { paymentApi } from './api';

declare global {
  interface Window { Razorpay: any; }
}

export async function startRazorpayPayment(bookingId: string, user: { name?: string; email?: string; phone?: string }) {
  const order = await paymentApi.createRazorpayOrder(bookingId);
  if (order.noPaymentRequired) return order;
  if (!window.Razorpay) throw new Error('Razorpay Checkout did not load. Please refresh and try again.');

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount * 100,
      currency: order.currency || 'INR',
      name: 'KrishiMitra',
      description: `Farm equipment booking ${bookingId}`,
      order_id: order.orderId,
      prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
      theme: { color: '#047857' },
      handler: async (response: any) => {
        try {
          const verified = await paymentApi.verifyAndConfirmPayment({ bookingId, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
          resolve(verified);
        } catch (error) { reject(error); }
      },
      modal: { ondismiss: () => reject(new Error('Payment window was closed.')) }
    });
    checkout.on('payment.failed', (response: any) => reject(new Error(response?.error?.description || 'Payment failed.')));
    checkout.open();
  });
}


export async function startRemainingRazorpayPayment(bookingId: string, user: { name?: string; email?: string; phone?: string }) {
  const order = await paymentApi.createRemainingRazorpayOrder(bookingId);
  if (!window.Razorpay) throw new Error('Razorpay Checkout did not load. Please refresh and try again.');

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: Math.round(Number(order.amount) * 100),
      currency: order.currency || 'INR',
      name: 'KrishiMitra',
      description: `Remaining rental payment ${order.bookingCode || bookingId}`,
      order_id: order.orderId,
      prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
      theme: { color: '#047857' },
      handler: async (response: any) => {
        try {
          const verified = await paymentApi.verifyRemainingRazorpayPayment({
            bookingId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          resolve(verified);
        } catch (error) { reject(error); }
      },
      modal: { ondismiss: () => reject(new Error('Payment window was closed.')) }
    });
    checkout.on('payment.failed', (response: any) => reject(new Error(response?.error?.description || 'Payment failed.')));
    checkout.open();
  });
}
