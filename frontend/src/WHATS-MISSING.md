# Rezvo Platform — Gap Analysis & What's Missing

## Status Summary

| Area | Status | Notes |
|------|--------|-------|
| Consumer Site (rezvo.co.uk) | 🟡 80% | Pages done, SEO done, needs deploy + backend wiring |
| Business Portal (rezvo.app) | 🟡 75% | UI done, onboarding done, needs data connection + stub pages |
| Backend API | 🟢 85% | 143 endpoints, all core CRUD done |
| Deployment | 🔴 Down | Server SSH timeout — needs VPS restart |

---

## 🔴 CRITICAL — Must Fix Before Launch

### 1. Server / Deployment
- **VPS (178.128.33.73) is unreachable** — SSH connection timed out. Need to restart via DigitalOcean console
- Neither frontend is deployed with latest code
- Need: nginx configs for rezvo.co.uk (consumer) and rezvo.app (portal)
- Need: PM2 or systemd service for FastAPI backend
- Need: SSL certs (Let's Encrypt) for both domains

### 2. Missing API Endpoint
- Consumer landing page calls `GET /directory/home` but this endpoint doesn't exist
- Need: Create `/directory/home` returning trending listings, categories, cities

### 3. Data — Empty Platform
- No restaurants seeded in the database (only seed script exists)
- Need: Run Google Places API seed for Nottingham restaurants
- Need: Populate categories, locations collections
- Without data, the consumer site shows empty results

### 4. Stripe Connect Integration
- Payments page exists but no Stripe Connect onboarding flow
- Need: Backend route for Stripe Connect OAuth
- Need: Frontend redirect flow in Settings/Payments
- Business owners can't receive payments without this

---

## 🟡 IMPORTANT — Before Burg Burgers Demo

### 5. Stub Dashboard Pages (need real content)
- **Analytics.jsx** — 13 lines, just a placeholder heading
- **Orders.jsx** — 82 lines, basic layout only
- **Reviews.jsx** — 99 lines, static demo data only (was rewritten but still minimal)
- **FloorPlan.jsx** — 75 lines, tier-locked splash page

### 6. Uber Direct Integration
- No code exists for Uber Direct delivery integration
- Need: Backend service to create delivery quotes
- Need: Sunmi terminal notification system
- Need: Order tracking UI in Orders page
- This is Burg Burgers' #1 requirement

### 7. Consumer Booking Flow
- BookingFlow.jsx exists (101 lines) but is skeletal
- Need: Full service/time/date picker connected to availability API
- Need: Guest details form with phone/email
- Need: Deposit payment via Stripe (for restaurants requiring it)
- Need: Booking confirmation with calendar invite

### 8. Email/SMS Notifications
- No email sending service configured
- Need: Booking confirmation emails (consumer + business)
- Need: Reminder emails/SMS (24hr before)
- Need: Growth engine emails (warm lead notifications to businesses)
- Options: SendGrid, Postmark, or Resend

---

## 🟢 NICE TO HAVE — Post-Launch Polish

### 9. Consumer Account Pages
- No "My Bookings" page for logged-in consumers
- No profile/preferences page
- No booking history or rebooking flow

### 10. 404 / Error Pages
- No custom 404 page on either site
- No error boundaries for React crashes
- No offline/maintenance page

### 11. Password Reset Flow
- Backend has `/auth/password-reset-request` and `/auth/password-reset-confirm`
- But no frontend pages exist for the reset flow
- Need: Forgot Password page + Reset Password page

### 12. Google Places Auto-Population
- Growth engine concept is documented but not wired up
- Need: Cron job or admin trigger to seed from Google Places
- Need: "Notify me" → warm lead → auto-email pipeline
- This is the self-sustaining growth flywheel

### 13. Mobile Apps
- Strategy calls for diner mobile app + owner mobile app
- Currently web-only
- Consider: React Native or PWA as Phase 2

### 14. White-Label Booking Page
- Scale tier promises "white-label booking page"
- Need: Subdomain routing (e.g., book.burgburgers.com → Rezvo hosted)
- Need: Custom branding injection (logo, colors, fonts)

---

## Priority Order for Next Sprint

1. **Fix VPS** → Get server back online
2. **Seed Nottingham data** → Run Google Places seed script
3. **Create /directory/home endpoint** → Consumer landing page works
4. **Deploy both frontends** → Live sites
5. **Build out BookingFlow** → Consumers can actually book
6. **Stripe Connect** → Businesses can receive payments
7. **Analytics page** → Full dashboard with charts
8. **Uber Direct** → Burg Burgers delivery capability
9. **Email notifications** → Booking confirmations
10. **Growth engine wiring** → Notify-me → warm leads pipeline
