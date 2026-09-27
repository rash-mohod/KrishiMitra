export type UserRole = 'FARMER' | 'OWNER' | 'ADMIN';

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR';
export type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus = 'CREATED' | 'PENDING' | 'ORDER_CREATED' | 'PAID' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'VERIFICATION_FAILED';
export type PaymentMethod = 'RAZORPAY' | 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING' | 'CASH' | 'UPI' | 'CASH_ON_DELIVERY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  state: string;
  district: string;
  village?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  imageUrl: string;
  itemCount?: number;
  averageRatePerDay: number;
}

export interface Equipment {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerRating: number;
  ownerVerified: boolean;
  name: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  model: string;
  manufacturingYear: number;
  horsepower?: number;
  fuelType?: 'DIESEL' | 'ELECTRIC' | 'PETROL' | 'MANUAL';
  condition: EquipmentCondition;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  securityDeposit: number;
  operatorAvailable: boolean;
  operatorCostPerDay: number;
  bookingAmount?: number;
  location: string;
  district: string;
  state: string;
  pincode: string;
  status: EquipmentStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  rating: number;
  reviewCount: number;
  totalRentals: number;
  createdAt: string;
  isFeatured?: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  equipmentLocation: string;
  categoryId: string;
  categoryName: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerEmail: string;
  farmerLocation: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  pricePerDay: number;
  baseAmount: number;
  platformFee: number;
  operatorIncluded: boolean;
  operatorAmount: number;
  securityDeposit: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingAmount?: number;
  remainingRentalAmount?: number;
  remainingPaymentStatus?: 'PENDING' | 'PAID' | 'NOT_REQUIRED';
  remainingPaymentMethod?: 'CASH' | 'RAZORPAY' | 'UPI';
  rentalCompletedAt?: string;
  ownerPaymentConfirmedAt?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  ownerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  pickupAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  bookingCode: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  ownerId: string;
  ownerName: string;
  amount: number;
  platformFee: number;
  ownerNetEarnings: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  bookingCode: string;
  equipmentId: string;
  equipmentName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  revieweeId: string;
  revieweeName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'EQUIPMENT' | 'SYSTEM';
  referenceId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  bookingCode: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: UserRole;
  againstId: string;
  againstName: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface EquipmentFilterParams {
  search?: string;
  category?: string;
  location?: string;
  state?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: EquipmentCondition | 'ALL';
  operatorRequired?: boolean;
  brand?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'featured' | 'price_low' | 'price_high' | 'rating' | 'newest';
}

export type ConversationType = 'DIRECT' | 'SUPPORT' | 'BOOKING' | 'DISPUTE' | 'RENTER_OWNER' | 'ADMIN_RENTER' | 'ADMIN_OWNER';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: UserRole;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string;
  replyToMessageId?: string;
  replyToMessageSnippet?: string;
  replyToSenderName?: string;
  attachmentUrl?: string;
  attachmentType?: 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  attachmentName?: string;
  attachmentSize?: number;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  isRead: boolean;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  editedAt?: string;
  deletedAt?: string;
  reactions?: Record<string, string>; // userId -> emoji
  createdAt: string;
  isAutomated?: boolean;
}

export interface ChatParticipant {
  id: string;
  userId?: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  isOnline?: boolean;
  lastSeen?: string;
  joinedAt?: string;
  lastReadAt?: string;
  isArchived?: boolean;
  isMuted?: boolean;
}

export interface ChatConversation {
  id: string;
  type: ConversationType;
  contextType?: 'NONE' | 'MACHINERY' | 'BOOKING' | 'DISPUTE' | 'SUPPORT';
  contextId?: string;
  participants: ChatParticipant[];
  equipmentId?: string;
  equipmentName?: string;
  equipmentImage?: string;
  equipmentRate?: number;
  bookingId?: string;
  bookingCode?: string;
  bookingDates?: string;
  disputeId?: string;
  disputeCode?: string;
  topic?: string;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
  lastMessageTime: string;
  unreadCountForUser: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReport {
  id: string;
  messageId: string;
  conversationId: string;
  reportedBy: string;
  reporterName: string;
  reporterRole: UserRole;
  reason: 'SPAM' | 'HARASSMENT' | 'FRAUD' | 'ABUSE' | 'INAPPROPRIATE' | 'SUSPICIOUS_PAYMENT' | 'OTHER';
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: string;
  messageSnippet?: string;
  messageSenderId?: string;
  messageSenderName?: string;
}
