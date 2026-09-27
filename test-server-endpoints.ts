/**
 * Direct API endpoint test script for Krishi Mitra Express Backend
 * Tests live endpoints, authentication, authorization, and route security.
 */
import { app } from './server/src/app.js';
import http from 'http';

async function runApiTests() {
  console.log('🧪 Starting Krishi Mitra Backend Endpoints Test...');
  
  const server = http.createServer(app);
  const port = 3099;
  await new Promise<void>((resolve) => server.listen(port, resolve));
  const baseUrl = `http://127.0.0.1:${port}`;

  let testsPassed = 0;
  let testsFailed = 0;

  function check(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${details || 'Assertion failed'}`);
      testsFailed++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    check('Health Check Endpoint', healthRes.status === 200 && healthData.data?.status === 'healthy');

    // 2. Equipment Categories (Public)
    const catRes = await fetch(`${baseUrl}/api/equipment/categories`);
    const catData = await catRes.json();
    check('Equipment Categories (Public)', catRes.status === 200 && catData.success === true && Array.isArray(catData.data?.categories));

    // 3. Equipment Listings (Public)
    const eqRes = await fetch(`${baseUrl}/api/equipment`);
    const eqData = await eqRes.json();
    check('Equipment Listings (Public)', eqRes.status === 200 && eqData.success === true && Array.isArray(eqData.data?.items));

    // 4. Auth - Registration Restriction: Public Admin Signup Blocked
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Admin',
        email: 'malicious.admin@test.com',
        phone: '9988776655',
        role: 'ADMIN',
        state: 'Maharashtra',
        district: 'Nagpur',
        password: 'Password123'
      })
    });
    check('Auth - Public Admin Signup Blocked', adminRegRes.status === 403);

    // 5. Auth - Password Minimum Length Enforcement (>= 8 chars)
    const shortPwRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Password Farmer',
        email: 'short.pw@test.com',
        phone: '9988776655',
        role: 'FARMER',
        state: 'Maharashtra',
        district: 'Nagpur',
        password: 'short'
      })
    });
    check('Auth - Password Minimum Length Enforcement', shortPwRes.status === 400);

    // 6. Auth - Invalid Login Attempt (Security Conscious 401)
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent.farmer@krishimitra.local', password: 'incorrect_password' })
    });
    const badLoginData = await badLoginRes.json();
    check('Auth - Invalid Login Attempt Gives Generic 401', badLoginRes.status === 401 && badLoginData.message === 'Invalid email or password.');

    // 7. Auth - Forgot Password Generic Response (No User Enumeration)
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'any_email@test.com' })
    });
    const forgotData = await forgotRes.json();
    check('Auth - Forgot Password Generic Response', forgotRes.status === 200 && forgotData.data?.message?.includes('password reset instructions have been sent'));

    // 8. Auth - Protected Route Rejects Missing Token
    const meNoTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    check('Auth - Protected Route Rejects Missing Token', meNoTokenRes.status === 401);

    // 9. Auth - Protected Route Rejects Forged Token
    const meForgedTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.forged.token' }
    });
    check('Auth - Protected Route Rejects Forged Token', meForgedTokenRes.status === 401);

    // 10. RBAC - Admin Stats Protected
    const adminStatsNoAuth = await fetch(`${baseUrl}/api/admin/stats`);
    check('RBAC - Admin Stats Protected from Unauthenticated Access', adminStatsNoAuth.status === 401);

    // 11. RBAC - Equipment Creation Requires OWNER Role
    const createEqNoAuth = await fetch(`${baseUrl}/api/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Tractor', pricePerDay: 2000, location: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', pincode: '440001' })
    });
    check('RBAC - Equipment Creation Protected', createEqNoAuth.status === 401);

    // 12. RBAC - Booking Creation Requires FARMER Role
    const createBookingNoAuth = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId: 'any-id', startDate: '2026-11-01', endDate: '2026-11-03', pickupAddress: 'Yard 1' })
    });
    check('RBAC - Booking Creation Protected', createBookingNoAuth.status === 401);

    // 13. Payments - Unimplemented Payments Route Returns 410
    const paymentOrderRes = await fetch(`${baseUrl}/api/payments/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const paymentOrderData = await paymentOrderRes.json();
    check('Payments - Returns 410 Gone with Unimplemented Notice', paymentOrderRes.status === 410 && paymentOrderData.message?.includes('not implemented'));

    // 14. Disputes - IDOR Protection: Dispute Creation Requires Authentication
    const disputeNoAuth = await fetch(`${baseUrl}/api/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'booking-id', reason: 'Defect', description: 'Engine issue' })
    });
    check('Disputes - Creation Protected against Unauthenticated/IDOR Access', disputeNoAuth.status === 401);

  } catch (err: any) {
    console.error('💥 Test suite runtime error:', err);
    testsFailed++;
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`🏁 API TEST SUITE FINISHED`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('==================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runApiTests();
