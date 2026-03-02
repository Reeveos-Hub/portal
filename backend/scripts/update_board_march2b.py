"""
Project Board Update — Session 2, 2 March 2026
=================================================
Updates Command Centre with bug fixes and EPOS frontend pages.

What changed this session:
1. CRITICAL BUG FIX: undefined 'user' variable across 6 route files (55 endpoints)
2. QR code fix — was 500ing + now encodes book.rezvo.app URL
3. Image crop modal fix — pan/drag wasn't working
4. 4 EPOS dashboard pages created (Inventory, KDS, Labour, Cash)
5. EPOS sidebar section added to navigation (restaurant only)

Run: cd /opt/rezvo-app && python3 backend/scripts/update_board_march2b.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rezvo")


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    now = datetime.utcnow().isoformat()
    added = 0
    updated = 0

    print("═" * 55)
    print("  PROJECT BOARD UPDATE — 2 March 2026 (Session 2)")
    print("═" * 55)

    # ─── 1. CRITICAL BUG FIXES ───
    print("▸ CRITICAL BUG FIXES")

    bug_fix_feature = {
        "title": "Critical: undefined 'user' fix across 6 route files",
        "description": (
            "The _get_business() helper was called with 'user' but no 'user' variable "
            "existed after tenant middleware migration. Fixed 55 calls across 6 files: "
            "run5_staff.py (9), run6_booking_page.py (6), run13_settings.py (13), "
            "run4_menu.py (6), run7_clients.py (11), run4_services.py (10). "
            "This was causing 500 errors on Staff, Settings, Menu, Guest CRM, Services, "
            "Online Booking QR code, and embed code generation."
        ),
        "stage": "live",
        "priority": "critical",
        "category": "bug_fix",
        "tags": ["backend", "bug", "critical", "tenant"],
        "checklist": [
            {"label": "run5_staff.py — 9 calls fixed", "done": True},
            {"label": "run6_booking_page.py — 6 calls fixed", "done": True},
            {"label": "run13_settings.py — 13 calls fixed", "done": True},
            {"label": "run4_menu.py — 6 calls fixed", "done": True},
            {"label": "run7_clients.py — 11 calls fixed", "done": True},
            {"label": "run4_services.py — 10 calls fixed", "done": True},
            {"label": "Staff page loads without 500", "done": True},
            {"label": "Settings page loads without 500", "done": True},
            {"label": "Menu page loads without 500", "done": True},
            {"label": "Guest CRM loads without 500", "done": True},
            {"label": "Online Booking QR code generates", "done": True},
            {"label": "Embed code generates correctly", "done": True},
        ],
        "created_at": now,
        "updated_at": now,
    }
    r = await db.project_board.update_one(
        {"title": bug_fix_feature["title"]},
        {"$set": bug_fix_feature},
        upsert=True,
    )
    if r.upserted_id:
        added += 1
        print(f"  ✅ Added: {bug_fix_feature['title']} → live")
    else:
        updated += 1
        print(f"  🔄 Updated: {bug_fix_feature['title']} → live")

    # QR code URL fix
    qr_fix = {
        "title": "QR code + embed URLs updated to book.rezvo.app",
        "description": (
            "QR codes and embed snippets were generating old portal.rezvo.app/book/ URLs. "
            "Now hardcoded to https://book.rezvo.app/{slug} in both the /qr and /embed endpoints."
        ),
        "stage": "live",
        "priority": "high",
        "category": "bug_fix",
        "tags": ["backend", "booking", "qr"],
        "checklist": [
            {"label": "QR endpoint encodes book.rezvo.app URL", "done": True},
            {"label": "Embed iframe uses book.rezvo.app", "done": True},
            {"label": "Embed button uses book.rezvo.app", "done": True},
            {"label": "QR image renders in dashboard", "done": True},
        ],
        "created_at": now,
        "updated_at": now,
    }
    r = await db.project_board.update_one(
        {"title": qr_fix["title"]}, {"$set": qr_fix}, upsert=True
    )
    if r.upserted_id:
        added += 1
        print(f"  ✅ Added: {qr_fix['title']} → live")
    else:
        updated += 1
        print(f"  🔄 Updated: {qr_fix['title']} → live")

    # Image crop fix
    crop_fix = {
        "title": "Image crop modal — pan/drag/zoom fix",
        "description": (
            "ImageCropModal objectFit changed from 'horizontal-cover' to 'contain' so images "
            "can be panned left/right/up/down. Added touchAction:none for mobile drag support."
        ),
        "stage": "live",
        "priority": "medium",
        "category": "bug_fix",
        "tags": ["frontend", "ui", "upload"],
        "checklist": [
            {"label": "objectFit set to contain", "done": True},
            {"label": "touchAction:none for mobile", "done": True},
            {"label": "Logo crop drag works", "done": True},
            {"label": "Cover photo crop drag works", "done": True},
        ],
        "created_at": now,
        "updated_at": now,
    }
    r = await db.project_board.update_one(
        {"title": crop_fix["title"]}, {"$set": crop_fix}, upsert=True
    )
    if r.upserted_id:
        added += 1
        print(f"  ✅ Added: {crop_fix['title']} → live")
    else:
        updated += 1
        print(f"  🔄 Updated: {crop_fix['title']} → live")

    # ─── 2. EPOS FRONTEND PAGES ───
    print("▸ EPOS FRONTEND PAGES (4 new dashboard pages)")

    epos_pages = [
        {
            "title": "EPOS Dashboard: Inventory Page",
            "description": (
                "Frontend page at /dashboard/inventory. Shows stock levels table, low-stock "
                "alerts, category filters, search, stock value calculation. Wired to "
                "/inventory/business/{id}/ingredients and /inventory/business/{id}/low-stock endpoints."
            ),
            "stage": "live",
            "priority": "high",
            "category": "epos_frontend",
            "tags": ["frontend", "epos", "inventory", "dashboard"],
            "checklist": [
                {"label": "EposInventory.jsx created", "done": True},
                {"label": "Route /dashboard/inventory in App.jsx", "done": True},
                {"label": "Stats row: total items, stock value, low stock, categories", "done": True},
                {"label": "Low stock alerts banner", "done": True},
                {"label": "Search + category filter", "done": True},
                {"label": "Ingredient table with status badges", "done": True},
                {"label": "Allergen tags displayed", "done": True},
                {"label": "Connected to inventory backend endpoints", "done": True},
            ],
        },
        {
            "title": "EPOS Dashboard: Kitchen Display (KDS) Page",
            "description": (
                "Frontend page at /dashboard/kds. Shows live ticket queue with urgency colors, "
                "station filters, auto-refresh every 15s. Wired to /kds/business/{id}/tickets "
                "and /kds/business/{id}/analytics endpoints."
            ),
            "stage": "live",
            "priority": "high",
            "category": "epos_frontend",
            "tags": ["frontend", "epos", "kds", "dashboard"],
            "checklist": [
                {"label": "EposKDS.jsx created", "done": True},
                {"label": "Route /dashboard/kds in App.jsx", "done": True},
                {"label": "Station filter buttons (color coded)", "done": True},
                {"label": "Live ticket cards with urgency colors", "done": True},
                {"label": "Auto-refresh every 15 seconds", "done": True},
                {"label": "Order type badges (dine-in/takeaway)", "done": True},
                {"label": "Kitchen Clear empty state", "done": True},
                {"label": "Station configuration display", "done": True},
                {"label": "Connected to KDS backend endpoints", "done": True},
            ],
        },
        {
            "title": "EPOS Dashboard: Labour & Rota Page",
            "description": (
                "Frontend page at /dashboard/labour. Shows staff on clock, labour cost %, "
                "hours today, EPOS staff PINs. Wired to /labour/business/{id}/dashboard endpoint."
            ),
            "stage": "live",
            "priority": "high",
            "category": "epos_frontend",
            "tags": ["frontend", "epos", "labour", "dashboard"],
            "checklist": [
                {"label": "EposLabour.jsx created", "done": True},
                {"label": "Route /dashboard/labour in App.jsx", "done": True},
                {"label": "Stats: on clock, labour cost %, hours, cost today", "done": True},
                {"label": "Staff on clock list with avatars", "done": True},
                {"label": "EPOS Staff PINs display", "done": True},
                {"label": "Labour cost % color coding (green/amber/red)", "done": True},
                {"label": "Connected to labour backend endpoints", "done": True},
            ],
        },
        {
            "title": "EPOS Dashboard: Cash & Finance Page",
            "description": (
                "Frontend page at /dashboard/cash. Shows auto P&L (revenue/COGS/labour/waste/net), "
                "cash drawer status, HMRC VAT reporting info, digital receipts config. "
                "Wired to /cash/business/{id}/drawer/status and /cash/business/{id}/pnl endpoints."
            ),
            "stage": "live",
            "priority": "high",
            "category": "epos_frontend",
            "tags": ["frontend", "epos", "cash", "finance", "dashboard"],
            "checklist": [
                {"label": "EposCash.jsx created", "done": True},
                {"label": "Route /dashboard/cash in App.jsx", "done": True},
                {"label": "Auto P&L: revenue, COGS, labour, waste, net profit", "done": True},
                {"label": "Net margin % display", "done": True},
                {"label": "Cash drawer status (open/closed/float/balance/variance)", "done": True},
                {"label": "HMRC VAT Boxes 1-7 info card", "done": True},
                {"label": "Digital receipts config display", "done": True},
                {"label": "Connected to cash/tax backend endpoints", "done": True},
            ],
        },
    ]

    for feat in epos_pages:
        feat["created_at"] = now
        feat["updated_at"] = now
        r = await db.project_board.update_one(
            {"title": feat["title"]}, {"$set": feat}, upsert=True
        )
        if r.upserted_id:
            added += 1
            print(f"  ✅ Added: {feat['title']} → live")
        else:
            updated += 1
            print(f"  🔄 Updated: {feat['title']} → live")

    # ─── 3. EPOS SIDEBAR NAVIGATION ───
    print("▸ EPOS SIDEBAR NAVIGATION")

    nav_feature = {
        "title": "EPOS section in dashboard sidebar",
        "description": (
            "New 'EPOS' section added to sidebar navigation for restaurant-type businesses. "
            "Contains 4 items: Inventory, Kitchen Display, Labour & Rota, Cash & Finance. "
            "Only visible when businessType === 'restaurant'. Added to navigation.js config, "
            "Sidebar.jsx buildSections, and ICON_MAP."
        ),
        "stage": "live",
        "priority": "high",
        "category": "frontend",
        "tags": ["frontend", "navigation", "sidebar", "epos"],
        "checklist": [
            {"label": "navigation.js epos section (restaurant only)", "done": True},
            {"label": "Sidebar.jsx EPOS rail group", "done": True},
            {"label": "4 EPOS icons in ICON_MAP", "done": True},
            {"label": "lucide-react imports (Package, Flame, Clock, Wallet)", "done": True},
            {"label": "Hidden for non-restaurant businesses", "done": True},
        ],
        "created_at": now,
        "updated_at": now,
    }
    r = await db.project_board.update_one(
        {"title": nav_feature["title"]}, {"$set": nav_feature}, upsert=True
    )
    if r.upserted_id:
        added += 1
        print(f"  ✅ Added: {nav_feature['title']} → live")
    else:
        updated += 1
        print(f"  🔄 Updated: {nav_feature['title']} → live")

    # ─── 4. UPDATE EXISTING EPOS BACKEND FEATURES ───
    print("▸ UPDATING EXISTING EPOS BACKEND FEATURES")

    # Update the EPOS backend features from session 1 — they now have frontend pages
    epos_backend_updates = [
        ("Inventory & Stock Management", "EPOS Dashboard: Inventory Page"),
        ("Kitchen Display System (KDS)", "EPOS Dashboard: Kitchen Display (KDS) Page"),
        ("Staff Labour Tracking", "EPOS Dashboard: Labour & Rota Page"),
        ("Cash Drawer Management", "EPOS Dashboard: Cash & Finance Page"),
        ("HMRC VAT Reporting (Auto)", "EPOS Dashboard: Cash & Finance Page"),
        ("Auto P&L from EPOS Data", "EPOS Dashboard: Cash & Finance Page"),
    ]

    for backend_title, frontend_title in epos_backend_updates:
        r = await db.project_board.update_one(
            {"title": backend_title},
            {
                "$set": {
                    "updated_at": now,
                    "notes": f"Frontend page live: {frontend_title}",
                },
                "$addToSet": {
                    "checklist": {"label": f"Frontend page created ({frontend_title})", "done": True}
                },
            },
        )
        if r.modified_count:
            updated += 1
            print(f"  🔄 Updated: {backend_title} — frontend page linked")

    # ─── SUMMARY ───
    total = await db.project_board.count_documents({})
    live = await db.project_board.count_documents({"stage": "live"})
    in_progress = await db.project_board.count_documents({"stage": "in_progress"})
    backlog = await db.project_board.count_documents({"stage": "backlog"})
    design = await db.project_board.count_documents({"stage": "design"})
    review = await db.project_board.count_documents({"stage": "review"})
    bugs = await db.project_board.count_documents({"category": "bug_fix"})
    epos = await db.project_board.count_documents({"tags": "epos"})

    print("=" * 55)
    print("  PROJECT BOARD UPDATED")
    print("=" * 55)
    print(f"  Added: {added} new features")
    print(f"  Updated: {updated} existing features")
    print(f"  Total features: {total}")
    print(f"  EPOS features: {epos}")
    print(f"  Bug fixes: {bugs}")

    bar_max = 30
    for label, count in [
        ("backlog", backlog), ("design", design),
        ("in_progress", in_progress), ("review", review), ("live", live),
    ]:
        filled = int((count / max(total, 1)) * bar_max)
        bar = "█" * filled + "░" * (bar_max - filled)
        print(f"  {label:<15} {bar} {count}")

    print(f"\n  🔴 LIVE NOW: {live}")
    print(f"  🟡 In Progress: {in_progress}")
    print(f"  ⚪ Backlog: {backlog}")
    print(f"  🐛 Bug Fixes: {bugs}")
    print("\n🎉 Done!")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
