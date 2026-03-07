"""
Push Session Summary + Migration Plan to Admin Library
Run: cd /opt/rezvo-app && python3 backend/scripts/push_to_library.py
"""
import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

SESSION_SUMMARY = """# ReeveOS Session Summary — 7 March 2026

## Session Overview
14+ hour development session. 25+ commits pushed to production. CRM system, ecommerce backend, shop management UI, Google Meet integration, client portal shop, and platform-wide data wiring.

## 1. CRM System (Complete)
- CRM Backend: 14 API endpoints — dashboard KPIs, pipeline management, client timeline, tasks, interactions, analytics, health scores, stage auto-assignment
- CRM Frontend: 4-view page (Dashboard, Pipeline, Clients, Analytics) — KPI cards, kanban board, searchable client table, full analytics
- Client Detail Panel: slide-in with stats, health score, LTV breakdown (treatments + packages + shop), bookings, shop orders, timeline, tasks
- Interaction Logger: animated slide panel for phone calls, walk-ins, DMs, WhatsApp, email with outcome tracking
- Pipeline Date Pill: All/Day/Week/Month filter inline with tab nav
- Data Fix: business_id vs businessId field mismatch resolved with _biz_match() dual-field helper
- 40 Rejuvenate clients seeded with real stats, 935 timeline events from 987 bookings

## 2. Ecommerce Backend (Complete)
- Shop API: 20 endpoints, 743 lines — products CRUD, cart, checkout, orders, discounts, gift vouchers
- Product Catalog: full Shopify-style fields (name, price, variants, SKU, stock, images, tags, SEO)
- Public Storefront API: no-auth endpoints scoped by business slug for QR code safety
- Cart System: session-based, add/update/remove, discount codes
- Checkout: validates stock, creates order, decrements inventory, logs to CRM timeline
- Order Management: pending → confirmed → processing → shipped → delivered flow
- Discount Engine: percentage/fixed, min spend, max uses, category scoping, expiry
- Gift Vouchers: purchase, redeem, balance tracking, 12-month expiry
- 26 real products seeded from Natalie's Shopify (8 Amatus, 8 Dermalogica, 3 kits, 4 packages, 3 vouchers)

## 3. Shop Manager UI (Complete)
- Products Tab: grid view, search, add/edit/archive via slide panels
- Orders Tab: status filters, progression buttons
- Discounts Tab: create codes, usage tracking
- Vouchers Tab: gold-branded display
- Sidebar: SHOP section with Products, Orders, Discounts, Gift Vouchers

## 4. CRM-Shop Integration (Complete)
- Dashboard KPIs: Revenue MTD = treatment + shop combined with split
- Client Detail: shop orders alongside bookings, matched by email
- Analytics: revenue breakdown, top selling products, discount usage
- Client LTV: real retail revenue from shop order data

## 5. Client Portal — Shop + Services (Complete)
- 6 tabs: Home, Bookings, Shop, Consultation, Messages, Profile
- Shop Tab: product grid, category filters, add-to-basket, cart
- Services section with Book button

## 6. Google Meet Video Consultations (Complete)
- 8 endpoints: OAuth connect, token refresh, create meeting, list, join, setup guide
- Each business connects their OWN Google account (like Stripe Connect)
- Auto-generates Meet link via Google Calendar API
- Free 1-on-1 consultations: NO time limit
- Google Cloud project "ReeveOS" created with credentials on VPS

## 7. Bug Fixes
- Global restaurant language purge (36+ refs)
- Chat system fixes (unread count, timestamps, auto-scroll)
- CRM import errors, router prefix, missing db definitions
- ClientMessages layout, emoji picker
- Marketing site symlink fix

## Commit Count: 25+ commits today
"""

MIGRATION_PLAN = """# ReeveOS Migration Plan — Rolling Deployment Checklist

## 1. Environment Variables (CRITICAL)
All must transfer to any new server. Missing one = platform breaks.

| Variable | Service | Notes |
|---|---|---|
| MONGODB_URL | Database | Update if host changes |
| JWT_SECRET_KEY | Auth | MUST be same or all sessions invalidate |
| REEVEOS_MASTER_KEY | Encryption | MUST be same or encrypted PII unreadable |
| ANTHROPIC_API_KEY | AI/SupportBot | Claude API |
| GOOGLE_CLIENT_ID | Google Meet | 1082528504644-k8jcl... |
| GOOGLE_CLIENT_SECRET | Google Meet | GOCSPX-f-YkbOL1ra... |
| GOOGLE_REDIRECT_URI | Google Meet | UPDATE if domain changes |
| STRIPE_SECRET_KEY | Payments | Stripe Connect |
| STRIPE_PUBLISHABLE_KEY | Payments | Frontend needs this |
| STRIPE_WEBHOOK_SECRET | Payments | Webhook verification |
| RESEND_API_KEY | Email | Transactional emails |
| CLOUDFLARE_API_TOKEN | CDN | Cache purge |
| DO_API_TOKEN | Infrastructure | DigitalOcean API |

## 2. Current Infrastructure
- VPS: 178.128.33.73 (Ubuntu 22.04, DigitalOcean)
- App: /opt/rezvo-app (FastAPI + React)
- Marketing: /var/www/reeveos.app (static HTML)
- MongoDB: localhost:27017, database: rezvo
- Nginx: reverse proxy + SSL (Let's Encrypt)
- Service: rezvo-backend (systemd, uvicorn on 8000)

## 3. Domains
| Domain | Purpose |
|---|---|
| portal.rezvo.app | Business portal + booking links |
| reeveos.app | Marketing site |
| rezvo.app | Marketing alias |
| rezvo.co.uk | Consumer directory |
| portaladmin.rezvo.app | Admin (deferred) |
| reevenow.com | Consumer brand (registered) |

## 4. Standard Deploy
```
cd /opt/rezvo-app
git fetch origin && git reset --hard origin/main
npm run build --prefix frontend
sudo systemctl restart rezvo-backend
python3 backend/scripts/test_platform.py
```

## 5. Cloudflare Cache Purge
Get Zone ID:
```
curl -s "https://api.cloudflare.com/client/v4/zones?name=reeveos.app" -H "Authorization: Bearer i1E0w5LjGV9RN1hsV_NPTEQubY7MmcdGxnQ-uoDb"
```
Purge:
```
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache" -H "Authorization: Bearer i1E0w5LjGV9RN1hsV_NPTEQubY7MmcdGxnQ-uoDb" -H "Content-Type: application/json" --data '{"purge_everything":true}'
```

## 6. GCP Migration Checklist
1. Provision GCP Compute Engine (Ubuntu 22.04)
2. Install Node.js, Python 3.10, MongoDB, Nginx
3. Clone repo, install dependencies
4. Copy .env with ALL variables
5. Restore MongoDB (mongodump → mongorestore)
6. Configure Nginx + SSL (certbot)
7. Create systemd service
8. Update DNS A records for all domains
9. Update GOOGLE_REDIRECT_URI if domain changes
10. Update Stripe webhook endpoint
11. Update Cloudflare origin IP
12. Run test_platform.py (37 tests)
13. Smoke test all portals
14. Set up nightly MongoDB dumps
15. Activate REEVEOS_MASTER_KEY (encryption)
16. Decommission DO droplet (after 48hr soak)

## 7. Security Status
| Item | Status |
|---|---|
| Tenant isolation | DONE |
| HTTPS everywhere | DONE |
| JWT auth | DONE |
| Immutable audit trail | DONE |
| Encryption engine (Fernet AES per tenant) | DONE |
| Activate REEVEOS_MASTER_KEY | PENDING (P0) |
| GDPR data export | TODO (P1) |
| GDPR erasure | TODO (P1) |
| Consent tracking | TODO (P1) |
| Rate limiting | TODO (P1) |
| Data retention cleanup | TODO (P2) |
"""


async def main():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.rezvo
    now = datetime.utcnow()

    docs = [
        {
            "title": "Session Summary — 7 March 2026",
            "category": "session_logs",
            "tags": ["session", "development", "crm", "ecommerce", "google-meet", "march-2026"],
            "content": SESSION_SUMMARY,
            "status": "current",
            "source": "claude_session",
            "related_ids": [],
            "metadata": {
                "date": "2026-03-07",
                "commits": 25,
                "duration": "14+ hours",
                "key_features": ["CRM", "Ecommerce", "Shop Manager", "Google Meet", "Client Portal Shop"],
            },
            "created_at": now,
            "updated_at": now,
        },
        {
            "title": "Migration Plan — DigitalOcean to GCP",
            "category": "infrastructure",
            "tags": ["migration", "gcp", "deployment", "infrastructure", "security", "env-vars"],
            "content": MIGRATION_PLAN,
            "status": "current",
            "source": "claude_session",
            "related_ids": [],
            "metadata": {
                "date": "2026-03-07",
                "type": "rolling_checklist",
                "current_host": "DigitalOcean",
                "target_host": "GCP",
            },
            "created_at": now,
            "updated_at": now,
        },
    ]

    for doc in docs:
        # Check if already exists (avoid duplicates)
        existing = await db.library.find_one({"title": doc["title"]})
        if existing:
            await db.library.update_one({"_id": existing["_id"]}, {"$set": {**doc, "updated_at": now}})
            print(f"Updated: {doc['title']}")
        else:
            await db.library.insert_one(doc)
            print(f"Created: {doc['title']}")

    total = await db.library.count_documents({})
    print(f"\nLibrary now has {total} documents")


asyncio.run(main())
