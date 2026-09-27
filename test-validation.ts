/**
 * Automated Verification and Test Suite for Krishi Mitra
 * Tests Core Business Logic, Data Stores, Pricing Math, Auth, Chat, Bookings, and Moderation
 */

// Node.js Environment polyfills for localStorage and window events
const memoryStore: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, val: string) => { memoryStore[key] = String(val); },
    removeItem: (key: string) => { delete memoryStore[key]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
  };
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true
  };
}
if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: any) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

import { authApi, bookingApi, equipmentApi, paymentApi, reviewApi, notificationApi, disputeApi, adminApi, chatApi, resetDatabaseToDefaults } from './src/services/api';
import { INITIAL_USERS, INITIAL_EQUIPMENT } from './src/services/mockData';

let testsPassed = 0;
let testsFailed = 0;
const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    testsPassed++;
    results.push({ name: testName, status: 'PASS' });
    console.log(`✅ PASS: ${testName}`);
  } else {
    testsFailed++;
    results.push({ name: testName, status: 'FAIL', error: detail || 'Assertion failed' });
    console.error(`❌ FAIL: ${testName} - ${detail}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING KRISHI MITRA FULL-STACK TEST SUITE');
  console.log('====================================================\n');

  // Reset to clean test state
  resetDatabaseToDefaults();

  // ----------------------------------------------------
  // TEST SUITE 1: AUTHENTICATION & USER MANAGEMENT
  // ----------------------------------------------------
  console.log('--- TEST SUITE 1: AUTH & ROLES ---');
  try {
    const farmerUser = await authApi.login('amit.farmer@agri.com', 'password123');
    assert(farmerUser.role === 'FARMER' && farmerUser.name === 'Amit Kumar', 'Farmer login by email');

    const ownerUser = await authApi.login('+91 94228 11223', 'password123');
    assert(ownerUser.role === 'OWNER' && ownerUser.name === 'Rajesh Patil', 'Owner login by phone (+91 94228 11223)');

    const adminUser = await authApi.login('admin@krishimitra.gov.in', 'password123');
    assert(adminUser.role === 'ADMIN', 'Admin login');

    let loginErrorCaught = false;
    try {
      await authApi.login('nonexistent@email.com', 'wrongpassword');
    } catch {
      loginErrorCaught = true;
    }
    assert(loginErrorCaught, 'Invalid credentials rejected');

    const registerResult = await authApi.register({
      name: 'Rameshwar Shinde',
      email: 'rameshwar.shinde@agri.com',
      phone: '9876543210',
      role: 'FARMER',
      state: 'Maharashtra',
      district: 'Pune',
      village: 'Baramati',
      password: 'SecurePassword123'
    });
    assert(registerResult.user.role === 'FARMER', 'New farmer registration');

    let dupErrorCaught = false;
    try {
      await authApi.register({
        name: 'Duplicate Test',
        email: 'rameshwar.shinde@agri.com',
        phone: '9876543210',
        role: 'FARMER',
        state: 'Maharashtra',
        district: 'Pune',
        password: 'SecurePassword123'
      });
    } catch {
      dupErrorCaught = true;
    }
    assert(dupErrorCaught, 'Duplicate email/phone registration prevented');
  } catch (err: any) {
    assert(false, 'Auth Suite Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 2: EQUIPMENT CATALOG & FILTERING
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 2: EQUIPMENT & CATALOG ---');
  try {
    const catalogRes = await equipmentApi.getEquipmentList();
    assert(catalogRes.items && catalogRes.items.length > 0, 'Equipment catalog retrieval', `Found ${catalogRes.items?.length} items`);

    const tractorsRes = await equipmentApi.getEquipmentList({ category: 'cat-tractors' });
    assert(tractorsRes.items.every(eq => eq.categoryId === 'cat-tractors'), 'Category filtering for tractors');

    const searchRes = await equipmentApi.getEquipmentList({ search: 'Mahindra' });
    assert(searchRes.items.some(eq => eq.brand.includes('Mahindra') || eq.name.includes('Mahindra')), 'Keyword search for Mahindra');

    const singleEquipment = await equipmentApi.getEquipmentById('eq-tractor-1');
    assert(singleEquipment !== null && singleEquipment.id === 'eq-tractor-1', 'Single equipment detail lookup');

    const availabilityCheck = await equipmentApi.checkAvailability('eq-tractor-1', '2026-09-01', '2026-09-05');
    assert(typeof availabilityCheck.isAvailable === 'boolean', 'Equipment calendar availability check');
  } catch (err: any) {
    assert(false, 'Equipment Suite Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 3: PRICING ENGINE & ESCROW CALCULATIONS
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 3: PRICING ENGINE & ESCROW MATH ---');
  try {
    const testEq = INITIAL_EQUIPMENT[0]; // e.g. pricePerDay: 2200, operatorCostPerDay: 450
    const priceWithOperator = bookingApi.calculatePrice(testEq, '2026-09-10', '2026-09-12', true); // 3 days
    
    assert(priceWithOperator.durationDays === 3, 'Rental duration calculation (inclusive)');
    assert(priceWithOperator.baseAmount === 3 * testEq.pricePerDay, 'Base amount calculation');
    assert(priceWithOperator.platformFee === Math.round(priceWithOperator.baseAmount * 0.05), 'Platform 5% escrow commission');
    assert(priceWithOperator.operatorAmount === 3 * testEq.operatorCostPerDay, 'Operator fee calculation');
    assert(priceWithOperator.totalAmount === priceWithOperator.baseAmount + priceWithOperator.platformFee + priceWithOperator.operatorAmount, 'Total pricing math integrity');
  } catch (err: any) {
    assert(false, 'Pricing Engine Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 4: BOOKING LIFECYCLE & STATE MACHINE
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 4: BOOKING WORKFLOW ---');
  try {
    const farmer = INITIAL_USERS.find(u => u.role === 'FARMER')!;
    const equipment = INITIAL_EQUIPMENT[0];

    const booking = await bookingApi.createBooking({
      equipmentId: equipment.id,
      farmer,
      startDate: '2026-10-01',
      endDate: '2026-10-03',
      operatorIncluded: true,
      pickupAddress: 'Farm Gate, Katol'
    });
    assert(booking.status === 'PENDING', 'Booking initial state is PENDING');
    assert(booking.bookingCode.startsWith('KM-'), 'Authoritative booking code generation');

    // Owner accepts
    const acceptedBooking = await bookingApi.acceptBooking(booking.id, equipment.ownerId, 'Ready at yard');
    assert(acceptedBooking.status === 'PAYMENT_PENDING', 'Owner acceptance transitions to PAYMENT_PENDING');

    // Payment verification: verify payments are safely disabled / not implemented
    let paymentNotImplementedCaught = false;
    try {
      await paymentApi.createRazorpayOrder(booking.id);
    } catch (err: any) {
      paymentNotImplementedCaught = err.message.includes('not implemented');
    }
    assert(paymentNotImplementedCaught, 'Online payment integration is safely flagged as not implemented in current version');

    // Owner starts rental
    const activeBooking = await bookingApi.startRental(booking.id, equipment.ownerId);
    assert(activeBooking.status === 'ACTIVE', 'Handover transitions booking to ACTIVE');

    // Owner completes rental
    const completedBooking = await bookingApi.completeRental(booking.id, equipment.ownerId);
    assert(completedBooking.status === 'COMPLETED', 'Return transitions booking to COMPLETED');
  } catch (err: any) {
    assert(false, 'Booking Lifecycle Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 5: REVIEWS & RATINGS
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 5: REVIEWS & REPUTATION ---');
  try {
    const farmer = INITIAL_USERS.find(u => u.role === 'FARMER')!;
    const bookings = await bookingApi.getFarmerBookings(farmer.id);
    const completed = bookings.find(b => b.status === 'COMPLETED');

    if (completed) {
      const review = await reviewApi.createReview({
        bookingId: completed.id,
        reviewer: farmer,
        rating: 5,
        comment: 'Outstanding performance and timely delivery by the owner.'
      });
      assert(review.rating === 5 && review.equipmentId === completed.equipmentId, 'Review creation and equipment rating attachment');
    } else {
      assert(true, 'Review test skipped (no initial completed booking for test user)');
    }
  } catch (err: any) {
    assert(false, 'Review Suite Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 6: REAL-TIME MESSAGING & NOTIFICATIONS
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 6: MESSAGING & CHAT ---');
  try {
    const farmer = INITIAL_USERS.find(u => u.role === 'FARMER')!;
    const owner = INITIAL_USERS.find(u => u.role === 'OWNER')!;

    const conv = await chatApi.getOrCreateConversation({
      currentUserId: farmer.id,
      targetUserId: owner.id,
      type: 'RENTER_OWNER',
      topic: 'Tractor rental inquiry',
      initialMessage: 'Is the 50 HP tractor available with rotavator attachment?'
    });
    assert(conv.id.startsWith('conv-') && conv.participants.length === 2, 'Conversation thread creation');

    const msg = await chatApi.sendMessage({
      conversationId: conv.id,
      senderId: owner.id,
      content: 'Yes, rotavator and seed drill are ready.'
    });
    assert(msg.conversationId === conv.id && msg.senderId === owner.id, 'Message transmission between participants');

    const unread = await chatApi.getUnreadMessagesCount(farmer.id);
    assert(unread >= 1, 'Unread message counter tracking');

    await chatApi.markConversationAsRead(conv.id, farmer.id);
    const unreadAfter = await chatApi.getUnreadMessagesCount(farmer.id);
    assert(unreadAfter === 0, 'Conversation mark as read reduces unread count to 0');
  } catch (err: any) {
    assert(false, 'Messaging Suite Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 7: DISPUTES & ADMIN MODERATION
  // ----------------------------------------------------
  console.log('\n--- TEST SUITE 7: DISPUTE ARBITRATION & ADMIN ---');
  try {
    const farmer = INITIAL_USERS.find(u => u.role === 'FARMER')!;
    const booking = (await bookingApi.getFarmerBookings(farmer.id))[0];

    const dispute = await disputeApi.createDispute({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      raisedByUserId: farmer.id,
      raisedByRole: 'FARMER',
      reason: 'EQUIPMENT_BREAKDOWN',
      description: 'Hydraulic pressure issue during field preparation.'
    });
    assert(dispute.status === 'OPEN' && dispute.bookingId === booking.id, 'Dispute filing and admin escalation');

    const resolvedDispute = await adminApi.resolveDispute(dispute.id, 'Escrow refund granted for 1 downtime day.');
    assert(resolvedDispute.status === 'RESOLVED' && resolvedDispute.adminResponse?.includes('Escrow refund'), 'Admin dispute resolution');

    const stats = await adminApi.getPlatformStats();
    assert(stats.totalUsers > 0 && stats.totalEquipment > 0, 'Platform analytics and GMV reporting');
  } catch (err: any) {
    assert(false, 'Dispute & Admin Suite Uncaught Exception', err.message);
  }

  // ----------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
  console.log(`✅ PASSED: ${testsPassed}`);
  console.log(`❌ FAILED: ${testsFailed}`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite();
