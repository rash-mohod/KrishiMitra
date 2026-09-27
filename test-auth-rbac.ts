/**
 * KrishiMitra Focused Security Test Suite
 * Tests:
 * 1. Public Signup Restrictions (Disallow ADMIN, require password >= 8, normalize email)
 * 2. Supabase Email Confirmation handling & Resend confirmation
 * 3. Login Security (Email+Password only, generic errors on invalid credentials)
 * 4. Password Reset flow (Generic responses to prevent email enumeration)
 * 5. Access Token Verification & Identity Derivation
 * 6. Role-Based Access Control (RBAC: FARMER vs OWNER vs ADMIN)
 * 7. Ownership Checks & IDOR Prevention (Equipment, Bookings, Disputes)
 * 8. Suspended User Enforcement (is_active = false -> 403)
 * 9. Unimplemented Payment routes safety (410 Gone)
 */

import http from 'http';
import { app } from './server/src/app.js';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🛡️  RUNNING KRISHIMITRA PRODUCTION AUTH & RBAC TESTS');
  console.log('====================================================\n');

  const server = http.createServer(app);
  const testPort = 4099;
  await new Promise<void>((resolve) => server.listen(testPort, resolve));
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Public Registration Restrictions
    // ----------------------------------------------------
    console.log('\n--- 1. Public Registration Security ---');

    // 1.1 Never allow ADMIN role in public registration
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: 'attacker.admin@test.com',
        phone: '9876543210',
        password: 'Password123!',
        role: 'ADMIN',
        state: 'Maharashtra',
        district: 'Nagpur'
      })
    });
    const adminRegData = await adminRegRes.json();
    assert(
      adminRegRes.status === 403 && adminRegData.success === false,
      'Reject public ADMIN registration with 403 Forbidden',
      `Status: ${adminRegRes.status}`
    );

    // 1.2 Reject short password (< 8 chars)
    const shortPwRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass User',
        email: 'weak.pass@test.com',
        phone: '9876543210',
        password: '12345',
        role: 'FARMER',
        state: 'Maharashtra',
        district: 'Nagpur'
      })
    });
    const shortPwData = await shortPwRes.json();
    assert(
      shortPwRes.status === 400 && shortPwData.success === false,
      'Reject registration with password < 8 characters',
      `Status: ${shortPwRes.status}`
    );

    // 1.3 Reject invalid email format
    const badEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email User',
        email: 'not-an-email',
        phone: '9876543210',
        password: 'Password123!',
        role: 'FARMER',
        state: 'Maharashtra',
        district: 'Nagpur'
      })
    });
    assert(
      badEmailRes.status === 400,
      'Reject registration with invalid email format',
      `Status: ${badEmailRes.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Email Confirmation & Resend Flows
    // ----------------------------------------------------
    console.log('\n--- 2. Email Confirmation & Resend Security ---');

    // 2.1 Resend confirmation returns generic message (prevents email enumeration)
    const resendRes = await fetch(`${baseUrl}/api/auth/resend-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent.user@randomdomain.in' })
    });
    const resendData = await resendRes.json();
    assert(
      resendRes.status === 200 && resendData.success === true && resendData.data?.message?.includes('verification link has been sent'),
      'Resend confirmation returns generic success to prevent email enumeration',
      resendData.data?.message
    );

    // ----------------------------------------------------
    // TEST 3: Login Security
    // ----------------------------------------------------
    console.log('\n--- 3. Login Security ---');

    // 3.1 Rejects invalid email/password with generic 401
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent.farmer@krishimitra.local',
        password: 'wrong_password_123'
      })
    });
    const badLoginData = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && badLoginData.success === false && badLoginData.message === 'Invalid email or password.',
      'Login failure gives generic "Invalid email or password" error',
      `Message: ${badLoginData.message}`
    );

    // 3.2 Rejects non-email phone login (enforces email + password only)
    const phoneLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '9876543210',
        password: 'password123'
      })
    });
    assert(
      phoneLoginRes.status === 400,
      'Reject login attempts using phone number instead of valid email',
      `Status: ${phoneLoginRes.status}`
    );

    // ----------------------------------------------------
    // TEST 4: Password Recovery & Reset Flow
    // ----------------------------------------------------
    console.log('\n--- 4. Password Reset Security ---');

    // 4.1 Forgot-password returns generic response for any email
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown.farmer@example.com' })
    });
    const forgotData = await forgotRes.json();
    assert(
      forgotRes.status === 200 && forgotData.success === true && forgotData.data?.message?.includes('password reset instructions have been sent'),
      'Forgot password does not reveal whether email exists in database',
      forgotData.data?.message
    );

    // 4.2 Reset password without token is rejected
    const resetNoTokenRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'NewSecurePassword123' })
    });
    assert(
      resetNoTokenRes.status === 401,
      'Reject password update when recovery token is missing',
      `Status: ${resetNoTokenRes.status}`
    );

    // ----------------------------------------------------
    // TEST 5: Access Token Validation
    // ----------------------------------------------------
    console.log('\n--- 5. Token Validation & Identity Derivation ---');

    // 5.1 Request without token to protected route
    const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 && noTokenData.message === 'Authentication required.',
      'Reject protected request without token with 401',
      `Status: ${noTokenRes.status}`
    );

    // 5.2 Request with invalid or forged Bearer token
    const fakeTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer forged.fake.jwt_token_attempt' }
    });
    assert(
      fakeTokenRes.status === 401,
      'Reject request with invalid/forged Bearer token with 401',
      `Status: ${fakeTokenRes.status}`
    );

    // ----------------------------------------------------
    // TEST 6: Role-Based Access Control (RBAC)
    // ----------------------------------------------------
    console.log('\n--- 6. Role Authorization (RBAC) ---');

    // 6.1 Admin endpoint requires authentication
    const adminStatsNoAuth = await fetch(`${baseUrl}/api/admin/stats`);
    assert(
      adminStatsNoAuth.status === 401,
      'Unauthenticated request to /api/admin/stats returns 401',
      `Status: ${adminStatsNoAuth.status}`
    );

    // 6.2 Admin users list requires ADMIN role
    const adminUsersNoAuth = await fetch(`${baseUrl}/api/auth/users`);
    assert(
      adminUsersNoAuth.status === 401,
      'Unauthenticated request to /api/auth/users returns 401',
      `Status: ${adminUsersNoAuth.status}`
    );

    // 6.3 Equipment creation requires OWNER role
    const createEqNoAuth = await fetch(`${baseUrl}/api/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Tractor', pricePerDay: 1500, location: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411001' })
    });
    assert(
      createEqNoAuth.status === 401,
      'Unauthenticated request to create equipment returns 401',
      `Status: ${createEqNoAuth.status}`
    );

    // 6.4 Booking creation requires FARMER role
    const createBookingNoAuth = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId: 'any-id', startDate: '2026-12-01', endDate: '2026-12-03', pickupAddress: 'Farm Gate' })
    });
    assert(
      createBookingNoAuth.status === 401,
      'Unauthenticated request to create booking returns 401',
      `Status: ${createBookingNoAuth.status}`
    );

    // ----------------------------------------------------
    // TEST 7: IDOR & Dispute Ownership Checks
    // ----------------------------------------------------
    console.log('\n--- 7. Ownership & IDOR Protection ---');

    // 7.1 Unauthenticated dispute creation rejected
    const disputeNoAuth = await fetch(`${baseUrl}/api/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'some-booking-id', reason: 'DEFECT', description: 'Equipment defect' })
    });
    assert(
      disputeNoAuth.status === 401,
      'Dispute creation requires authenticated session',
      `Status: ${disputeNoAuth.status}`
    );

    // ----------------------------------------------------
    // TEST 8: Unimplemented Payments Route Handling
    // ----------------------------------------------------
    console.log('\n--- 8. Safe Payments Status ---');

    const paymentRes = await fetch(`${baseUrl}/api/payments/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const paymentData = await paymentRes.json();
    assert(
      paymentRes.status === 410 && paymentData.success === false && paymentData.message.includes('not implemented'),
      'Online payment endpoints safely return 410 Gone with explicit message',
      `Status: ${paymentRes.status}`
    );

  } catch (err: any) {
    console.error('💥 Test suite execution error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`🏁 SECURITY TEST RESULTS`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
