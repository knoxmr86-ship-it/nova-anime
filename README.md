# NOVA ANIME — Owner-controlled membership website

## What is included
- Aesthetic dark/anime-inspired frontend.
- Owner-only admin panel at `/admin`.
- Add/delete anime from the owner panel.
- Change site name and weekly membership price from the owner panel.
- Members-only watch endpoint: video URLs are not returned by `/api/anime/:id` unless membership is active.
- Login/session structure.
- Easypaisa and JazzCash payment buttons are prepared as integration points.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Set a strong `SESSION_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`.
4. Run:
   npm install
   npm start
5. Open `http://localhost:3000`
6. Owner panel: `http://localhost:3000/admin`

## Important payment note
Do NOT collect card/mobile-wallet PINs, OTPs, passwords, or other secrets yourself.
For real Easypaisa/JazzCash payments, create the appropriate merchant account and connect the official merchant API/checkout plus server-to-server webhook. The webhook should verify the transaction and then set the user's `membership_until` to 7 days in the future.

## Important content note
Only upload/embed anime that you own or have permission/license to distribute. This starter does not provide pirated anime or bypass DRM.

## Production hardening
Before launch, use HTTPS, a production session store, secure cookies, rate limiting, CSRF protection, input validation, database backups, and server-side payment verification.
