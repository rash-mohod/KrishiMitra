export interface PaymentCalculationInput {
  totalRentalAmount: number;
  bookingAmount: number;
}

export interface PaymentCalculation {
  totalRentalAmount: number;
  bookingAmount: number;
  remainingRentalAmount: number;
  platformFee: number;
  onlinePaymentAmount: number;
}

export function calculatePlatformFee(totalRentalAmount: number): number {
  const amount = Math.max(0, Math.round(totalRentalAmount));
  if (amount === 0) return 0;
  if (amount <= 499) return 5;
  if (amount <= 999) return 10;
  if (amount <= 1499) return 15;
  if (amount <= 1999) return 20;
  if (amount <= 2499) return 25;
  if (amount <= 2999) return 30;
  if (amount <= 3499) return 35;
  if (amount <= 3999) return 40;
  if (amount <= 4499) return 45;
  return 50;
}

export function calculateBookingPayment(input: PaymentCalculationInput): PaymentCalculation {
  const totalRentalAmount = Math.max(0, Math.round(input.totalRentalAmount));
  const bookingAmount = Math.max(0, Math.round(input.bookingAmount));
  const maximumBookingAmount = Math.floor(totalRentalAmount * 0.2);

  if (bookingAmount > maximumBookingAmount) {
    throw new Error(`Booking amount cannot exceed 20% of total rental amount. Maximum allowed: ₹${maximumBookingAmount}`);
  }

  const platformFee = calculatePlatformFee(totalRentalAmount);
  return {
    totalRentalAmount,
    bookingAmount,
    remainingRentalAmount: totalRentalAmount - bookingAmount,
    platformFee,
    onlinePaymentAmount: bookingAmount + platformFee
  };
}
