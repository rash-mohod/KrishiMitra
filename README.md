# KrishiMitra

KrishiMitra is a farm-equipment rental marketplace that connects farmers with equipment owners. The app allows users to browse machinery, request bookings, pay the online booking advance, track rental status, and communicate with owners through chat.

## Current architecture

The project currently uses:

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database/Auth: Supabase PostgreSQL + Supabase Auth + Storage
- Payments: Razorpay integration for booking advance payments
- Realtime: SSE-based chat delivery

The browser is not using a legacy local demo database. The frontend stores the auth tokens needed for authenticated API calls in browser storage, while the application data itself lives in Supabase.

## Project structure

- `src/` – React frontend application
- `server/src/` – Express API server
- `server/src/routes/` – REST API route handlers
- `server/src/config/` – environment and Supabase configuration
- `server/src/db/seed.ts` – demo data seeding script
- `server/*.sql` – Supabase schema and migration files

## Current booking lifecycle

The booking status flow used by the backend is:

`PENDING -> PAYMENT_PENDING -> CONFIRMED -> ACTIVE -> COMPLETED`

Additional statuses include:

- `REJECTED`
- `CANCELLED`
- `HANDOVER_PENDING`
- `RETURN_REQUESTED`
- `INSPECTION_PENDING`
- `DISPUTED`
- `EXPIRED`
- `PAYMENT_FAILED`
- `REFUND_PENDING`
- `REFUNDED`

Availability checks block overlapping dates for active booking states such as `PENDING`, `PAYMENT_PENDING`, `CONFIRMED`, and `ACTIVE`. Date calculations are inclusive, so a booking from 10 Sep to 12 Sep covers 3 days.

## Payment model

KrishiMitra uses a partial online payment flow:

1. The owner can define a `booking_amount` for an equipment listing.
2. The backend calculates the total rental amount, platform fee, online payment amount, and remaining rental due.
3. The farmer pays the online booking amount through Razorpay.
4. The booking moves to `CONFIRMED` only after signature verification and server-side payment validation.
5. The remaining balance is paid directly to the owner by cash or UPI, and the owner confirms that payment through the owner flow.

The platform fee is calculated by rental slab. The current logic in the backend supports these levels:

- ₹0 = ₹0
- ₹1–₹499 = ₹5
- ₹500–₹999 = ₹10
- ₹1,000–₹1,499 = ₹15
- ₹1,500–₹1,999 = ₹20
- ₹2,000–₹2,499 = ₹25
- ₹2,500–₹2,999 = ₹30
- ₹3,000–₹3,499 = ₹35
- ₹3,500–₹3,999 = ₹40
- ₹4,000–₹4,499 = ₹45
- ₹4,500+ = ₹50

## Environment setup

### 1. Create the database

Create a Supabase project and run the SQL files in this order:

1. `server/supabase-schema.sql`
2. `server/supabase-payment-migration.sql`
3. `server/supabase-profile-migration.sql`
4. `server/supabase-stability-migration.sql` (run once for the overlap guard)

### 2. Configure environment variables

Copy the examples and fill in the values:

```bash
cp .env.example .env.local
cp server/.env.example server/.env
```

Frontend `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Backend `server/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

> The service role key must stay on the backend only. Never expose it to the browser or commit it to a frontend environment.

## Demo accounts and seed data

The project includes a seeded demo dataset. Run:

```bash
cd server
npm install
npm run seed
```

Default demo password:

```text
password123
```

Demo accounts:

- Farmer: `amit.farmer@agri.com`
- Farmer: `sunita.farmer@agri.com`
- Owner: `rajesh.patil@agri.com`
- Owner: `suresh.machinery@agri.com`
- Admin: `admin@krishimitra.gov.in`

The seed script creates confirmed Supabase users and inserts demo equipment and profiles.

## Running the app

### Start backend

```bash
cd server
npm install
npm run dev
```

API runs at:

```text
http://localhost:5000
```

### Start frontend

From the project root:

```bash
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

You can also use the root-level convenience scripts:

```bash
npm run server:dev
npm run server:seed
```

## Main API endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/profile/avatar`
- `GET /api/auth/users`

### Equipment

- `GET /api/equipment`
- `GET /api/equipment/:id`
- `GET /api/equipment/owner/:ownerId`
- `GET /api/equipment/categories`
- `POST /api/equipment`
- `PUT /api/equipment/:id`
- `PATCH /api/equipment/:id/status`
- `DELETE /api/equipment/:id`

### Bookings

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/owner`
- `GET /api/bookings/admin`
- `PATCH /api/bookings/:id/accept`
- `PATCH /api/bookings/:id/reject`
- `PATCH /api/bookings/:id/cancel`
- `PATCH /api/bookings/:id/start`
- `PATCH /api/bookings/:id/complete`
- `POST /api/bookings/:id/return-request`

### Payments and notifications

- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`
- `GET /api/payments/my-payments`
- `GET /api/payments/owner`
- `GET /api/payments/admin`
- `GET /api/payments/:bookingId`
- `PATCH /api/payments/:bookingId/remaining-payment`
- `GET /api/notifications`

### Chat, reviews, disputes and favorites

- `GET /api/chat/conversations`
- `POST /api/chat/conversations`
- `GET /api/chat/conversations/:id/messages`
- `POST /api/chat/conversations/:id/messages`
- `GET /api/reviews/equipment/:id`
- `POST /api/reviews`
- `GET /api/disputes`
- `POST /api/disputes`
- `GET /api/favorites`
- `POST /api/favorites`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`

## Security and validation

The backend uses:

- Helmet for HTTP header hardening
- CORS restricted to `FRONTEND_URL`
- Express rate limiting
- Zod input validation
- Supabase auth token verification
- Role-based authorization for farmer, owner, and admin routes
- Server-side payment verification before booking confirmation

## Realtime chat

Chat delivery uses SSE from the backend. The frontend listens for chat events and refreshes the normal API data as needed if the stream reconnects.

## Notes for deployment

The backend is designed to be stateless and portable, and it can be deployed behind a container or VM environment. Supabase remains the managed database/auth layer in the current setup.

## Troubleshooting

- If the frontend cannot connect to the API, confirm `VITE_API_URL` points to the backend and the backend is running on port 5000.
- If auth fails, confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are correct.
- If Razorpay verification fails, make sure the key and webhook secrets in `server/.env` are set and match the payment configuration in your Razorpay dashboard.
- If demo logins do not work, re-run `npm run seed` after checking that the Supabase project is configured correctly.
