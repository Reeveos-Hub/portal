"""
Migration: Add complete EPOS backend features to Command Centre project board.
Run once after deployment: python scripts/migrate_epos_features.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rezvo")


async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    now = datetime.utcnow()

    # ═══════════════════════════════════════════════════════
    # PHASE 1: Mark existing features that are now DONE
    # ═══════════════════════════════════════════════════════

    # QR code dine-in ordering → BACKEND DONE (pay_at_table.py)
    await db.project_features.update_one(
        {"name": "QR code dine-in ordering"},
        {"$set": {
            "stage": "in_progress",
            "checks": [
                {"t": "QR code generator per table", "d": True},
                {"t": "Table-linked ordering session", "d": True},
                {"t": "Order routes to kitchen with table #", "d": True},
                {"t": "Pay-at-table via Stripe", "d": True},
                {"t": "Call waiter from phone", "d": True},
                {"t": "Post-payment review prompt", "d": True},
                {"t": "Frontend UI for customer", "d": False},
            ],
            "updated_at": now,
        }}
    )

    # Loyalty programme → BACKEND DONE (epos_ai.py)
    await db.project_features.update_one(
        {"name": "Loyalty programme (points)"},
        {"$set": {
            "stage": "in_progress",
            "checks": [
                {"t": "Points earning rules", "d": True},
                {"t": "Tier system (Bronze→Platinum)", "d": True},
                {"t": "Redemption at checkout", "d": True},
                {"t": "Customer loyalty balance API", "d": True},
                {"t": "Admin config panel", "d": True},
                {"t": "Frontend loyalty card view", "d": False},
            ],
            "updated_at": now,
        }}
    )

    # Online food ordering → BACKEND DONE (online_ordering.py + orders.py)
    await db.project_features.update_one(
        {"name": "Online food ordering flow"},
        {"$set": {
            "stage": "in_progress",
            "checks": [
                {"t": "Consumer menu page with categories", "d": False},
                {"t": "Item detail modal + dietary badges", "d": False},
                {"t": "Modifier groups in item view", "d": False},
                {"t": "Cart drawer with running total", "d": False},
                {"t": "Stripe checkout + Apple Pay", "d": False},
                {"t": "Order→kitchen API endpoint", "d": True},
                {"t": "Order confirmation page + email", "d": False},
                {"t": "Restaurant order acceptance dash", "d": True},
                {"t": "Real-time order status updates", "d": True},
                {"t": "Mobile responsive end-to-end", "d": False},
            ],
            "updated_at": now,
        }}
    )

    print("✅ Phase 1: Updated existing features")

    # ═══════════════════════════════════════════════════════
    # PHASE 2: Add NEW EPOS features (backend complete)
    # ═══════════════════════════════════════════════════════

    new_features = [
        # ─── EPOS CORE (all backend done) ─── #
        {
            "name": "EPOS Order Lifecycle",
            "desc": "Complete till order flow: create→modify→fire→split→pay→close→refund. 19 endpoints, 865 lines. Handles dine-in, takeaway, delivery, kiosk.",
            "cat": "EPOS", "pri": "P0", "stage": "in_progress",
            "comp": ["Epos Now", "Toast", "Square", "Lightspeed"],
            "effort": "High", "rev": "Very High",
            "checks": [
                {"t": "Create order (dine-in/takeaway/delivery/kiosk)", "d": True},
                {"t": "Add/remove/modify items on open order", "d": True},
                {"t": "Fire to kitchen (course-based)", "d": True},
                {"t": "Discount engine (%, fixed, comp, item-level)", "d": True},
                {"t": "Service charge management", "d": True},
                {"t": "Split bill (equal/seat/item/custom)", "d": True},
                {"t": "Payment processing (card/cash/split)", "d": True},
                {"t": "Cash change calculation", "d": True},
                {"t": "Tips on payment", "d": True},
                {"t": "Void order with reason logging", "d": True},
                {"t": "Refund (full/partial/item-level)", "d": True},
                {"t": "Receipt generation (print + digital)", "d": True},
                {"t": "Table time tracking (live)", "d": True},
                {"t": "Shift report (X report)", "d": True},
                {"t": "Z report (end of day)", "d": True},
                {"t": "Sequential order numbering per day", "d": True},
                {"t": "Auto table status on pay/void", "d": True},
                {"t": "Void log with audit trail", "d": True},
                {"t": "Frontend EPOS till screen", "d": False},
            ],
        },
        {
            "name": "Kitchen Display System (KDS)",
            "desc": "Real-time kitchen ticket management. 12 endpoints, 305 lines. Station routing, prep timers, bump bar, all-day view, recall.",
            "cat": "EPOS", "pri": "P0", "stage": "in_progress",
            "comp": ["Toast", "Epos Now", "Lightspeed", "Square"],
            "effort": "High", "rev": "Very High",
            "checks": [
                {"t": "Station configuration (prep/expo/bar)", "d": True},
                {"t": "Live ticket queue per station", "d": True},
                {"t": "Colour-coded urgency (green→red by age)", "d": True},
                {"t": "Start ticket (in progress)", "d": True},
                {"t": "Mark individual items done", "d": True},
                {"t": "Bump ticket (all items ready)", "d": True},
                {"t": "Served confirmation", "d": True},
                {"t": "Recall last bumped ticket", "d": True},
                {"t": "Priority system (normal/rush/VIP)", "d": True},
                {"t": "All-day view (aggregate item counts)", "d": True},
                {"t": "Recently fulfilled history", "d": True},
                {"t": "KDS analytics (avg prep time, throughput)", "d": True},
                {"t": "Frontend KDS screen UI", "d": False},
            ],
        },
        {
            "name": "Inventory & Stock Management",
            "desc": "Full stock system. 18 endpoints, 549 lines. Ingredients, stock levels, alerts, waste tracking, recipes, food costing, suppliers, POs, auto-reorder.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": ["Epos Now", "Toast", "Lightspeed"],
            "effort": "High", "rev": "High",
            "checks": [
                {"t": "Ingredient CRUD with categories", "d": True},
                {"t": "Stock level tracking", "d": True},
                {"t": "Low-stock alerts with thresholds", "d": True},
                {"t": "Stock adjustments (delivery/waste/stocktake)", "d": True},
                {"t": "Bulk stocktake with discrepancy detection", "d": True},
                {"t": "Recipe linking (menu item → ingredients)", "d": True},
                {"t": "Automatic food cost % per dish", "d": True},
                {"t": "Food cost report across whole menu", "d": True},
                {"t": "Waste logging with reason + cost", "d": True},
                {"t": "Waste report (by reason + ingredient)", "d": True},
                {"t": "Supplier management", "d": True},
                {"t": "Purchase order creation + tracking", "d": True},
                {"t": "PO receive → auto stock update", "d": True},
                {"t": "AI reorder suggestions (usage-based)", "d": True},
                {"t": "Frontend inventory dashboard", "d": False},
            ],
        },
        {
            "name": "Staff Labour Tracking",
            "desc": "Clock in/out, breaks, labour cost %. 10 endpoints, 439 lines. Real-time labour cost vs revenue — NO competitor does this live.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": ["Toast", "Epos Now", "Lightspeed"],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "PIN-based clock in/out", "d": True},
                {"t": "Break tracking (start/end, types)", "d": True},
                {"t": "Who's on shift (live view)", "d": True},
                {"t": "Running labour cost (real-time)", "d": True},
                {"t": "Labour cost % vs revenue report", "d": True},
                {"t": "Staff performance (sales per person)", "d": True},
                {"t": "Shift scheduling / rota", "d": True},
                {"t": "Bulk rota creation", "d": True},
                {"t": "Tip distribution (equal/hours/custom)", "d": True},
                {"t": "Daily/staff breakdown reports", "d": True},
                {"t": "Frontend labour dashboard", "d": False},
            ],
        },
        {
            "name": "Pay-at-Table & QR Self-Service",
            "desc": "Customer scans QR → views menu → orders → pays → tips → reviews. 9 endpoints, 450 lines. NONE of the UK competitors include this natively.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "QR token generation per table", "d": True},
                {"t": "Scan → menu + table detection", "d": True},
                {"t": "Customer places order from phone", "d": True},
                {"t": "Auto-fire to KDS with table number", "d": True},
                {"t": "View bill from phone", "d": True},
                {"t": "Pay full or split from phone", "d": True},
                {"t": "Add tip during payment", "d": True},
                {"t": "Post-payment review prompt", "d": True},
                {"t": "Call waiter button", "d": True},
                {"t": "Table alerts dashboard for staff", "d": True},
                {"t": "Frontend consumer web app", "d": False},
            ],
        },
        {
            "name": "Cash Drawer Management",
            "desc": "Opening float, closing count, variance detection, cash drops. 4 endpoints. Automatic expected vs actual calculation.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": ["Epos Now", "Toast"],
            "effort": "Low", "rev": "Medium",
            "checks": [
                {"t": "Opening float with denomination breakdown", "d": True},
                {"t": "Closing count with auto-variance calc", "d": True},
                {"t": "Cash drop to safe", "d": True},
                {"t": "Variance history + audit trail", "d": True},
                {"t": "Frontend cash management UI", "d": False},
            ],
        },
        {
            "name": "VAT / Tax Reporting (HMRC-Ready)",
            "desc": "Auto-generate VAT Box 1-7 from EPOS data. Daily breakdown, payment method splits. NO competitor auto-generates HMRC returns from POS data.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Output VAT from sales (Box 1)", "d": True},
                {"t": "Input VAT from purchases (Box 4)", "d": True},
                {"t": "Net VAT payable (Box 5)", "d": True},
                {"t": "Total sales ex-VAT (Box 6)", "d": True},
                {"t": "Total purchases ex-VAT (Box 7)", "d": True},
                {"t": "Daily revenue/VAT breakdown", "d": True},
                {"t": "Payment method breakdown", "d": True},
                {"t": "Quarterly/monthly/annual periods", "d": True},
                {"t": "Frontend tax dashboard", "d": False},
            ],
        },
        {
            "name": "Automatic P&L from EPOS Data",
            "desc": "Revenue - COGS - Labour - Waste = Operating Profit. Auto-calculated from orders, inventory, and time clock. NO competitor does this.",
            "cat": "EPOS", "pri": "P1", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "Very High",
            "checks": [
                {"t": "Revenue from orders", "d": True},
                {"t": "COGS from purchase orders", "d": True},
                {"t": "Labour cost from time clock", "d": True},
                {"t": "Waste cost from waste log", "d": True},
                {"t": "Gross profit %", "d": True},
                {"t": "Operating profit %", "d": True},
                {"t": "Prime cost calculation", "d": True},
                {"t": "Frontend P&L dashboard", "d": False},
            ],
        },
        {
            "name": "Multi-Site Central Dashboard",
            "desc": "Cross-location overview: revenue, staff, orders, stock alerts per site. Epos Now charges extra — we include it free.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": ["Epos Now"],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Revenue per site", "d": True},
                {"t": "Active staff per site", "d": True},
                {"t": "Open orders per site", "d": True},
                {"t": "Low stock alerts per site", "d": True},
                {"t": "Total rollup metrics", "d": True},
                {"t": "Frontend multi-site view", "d": False},
            ],
        },
        {
            "name": "AI Menu Optimizer (Star/Puzzle/Plowhorse/Dog)",
            "desc": "Quadrant analysis: profitability × popularity. Auto-recommendations per dish. ZERO competitors have this.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "Very High",
            "checks": [
                {"t": "Sales data aggregation per item", "d": True},
                {"t": "Food cost integration from recipes", "d": True},
                {"t": "Quadrant classification algorithm", "d": True},
                {"t": "Auto-recommendation engine", "d": True},
                {"t": "Frontend menu optimizer dashboard", "d": False},
            ],
        },
        {
            "name": "Predictive Prep Forecasting",
            "desc": "Forecasts what to prep based on same-day/time patterns from past 8 weeks. ZERO competitors have this.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Historical pattern analysis (8-week lookback)", "d": True},
                {"t": "Weighted average forecasting", "d": True},
                {"t": "Confidence scoring", "d": True},
                {"t": "Per-item predicted quantities", "d": True},
                {"t": "Frontend prep forecast view", "d": False},
            ],
        },
        {
            "name": "Smart Upsell Engine (Real-Time AI)",
            "desc": "Suggests add-ons based on what's in the order using association rules. ZERO competitors have real-time AI upsell.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Association rule mining from past orders", "d": True},
                {"t": "Real-time suggestions per order", "d": True},
                {"t": "Pitch text generation", "d": True},
                {"t": "Frontend upsell prompt on till", "d": False},
            ],
        },
        {
            "name": "AI Waste Predictor",
            "desc": "Predicts waste before it happens based on shelf life vs usage rate. Suggests specials to use expiring stock. ZERO competitors.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": [],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Shelf life tracking per ingredient", "d": True},
                {"t": "Usage rate calculation (14-day lookback)", "d": True},
                {"t": "Waste quantity prediction", "d": True},
                {"t": "Waste cost prediction", "d": True},
                {"t": "Specials/staff meal suggestions", "d": True},
                {"t": "Frontend waste prediction dashboard", "d": False},
            ],
        },
        {
            "name": "Peak Time Heatmap",
            "desc": "Day × hour heatmap of order volume and revenue. Helps with staffing decisions.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": ["Toast"],
            "effort": "Low", "rev": "Medium",
            "checks": [
                {"t": "Day × hour aggregation pipeline", "d": True},
                {"t": "Orders + revenue per slot", "d": True},
                {"t": "8-week averaging", "d": True},
                {"t": "Frontend heatmap visualization", "d": False},
            ],
        },
        {
            "name": "Real-Time Food Cost Per Order",
            "desc": "Shows actual GP% per order as it's being taken. Managers can see if an order is profitable before it's served.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": [],
            "effort": "Low", "rev": "High",
            "checks": [
                {"t": "Recipe-based cost calculation per order", "d": True},
                {"t": "Per-item margin display", "d": True},
                {"t": "Order-level GP%", "d": True},
                {"t": "Frontend cost overlay on till", "d": False},
            ],
        },
        {
            "name": "Digital Receipts (Email/SMS)",
            "desc": "Send receipts digitally instead of printing. Reduces paper waste, enables marketing follow-up.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": ["Toast", "Square"],
            "effort": "Low", "rev": "Medium",
            "checks": [
                {"t": "Receipt data generation", "d": True},
                {"t": "Email receipt endpoint", "d": True},
                {"t": "SMS receipt endpoint", "d": True},
                {"t": "Resend/Twilio integration", "d": False},
                {"t": "Branded receipt template", "d": False},
            ],
        },
        {
            "name": "Kiosk Self-Ordering",
            "desc": "Menu display optimised for kiosk/tablet. Customer browses, orders, pays — fires directly to KDS.",
            "cat": "EPOS", "pri": "P2", "stage": "in_progress",
            "comp": ["Epos Now", "Toast"],
            "effort": "Medium", "rev": "High",
            "checks": [
                {"t": "Kiosk menu API (categories, images, modifiers)", "d": True},
                {"t": "Kiosk order placement + auto-fire to KDS", "d": True},
                {"t": "Frontend kiosk UI", "d": False},
            ],
        },
        {
            "name": "Online Ordering (Consumer Web)",
            "desc": "Full consumer ordering: browse menu, add to cart, choose delivery/collection, checkout, track status.",
            "cat": "EPOS", "pri": "P0", "stage": "in_progress",
            "comp": ["Toast", "Square", "Deliveroo", "UberEats"],
            "effort": "High", "rev": "Very High",
            "checks": [
                {"t": "Consumer menu API", "d": True},
                {"t": "Cart management API", "d": True},
                {"t": "Checkout + payment API", "d": True},
                {"t": "Delivery zone + fee calculation", "d": True},
                {"t": "Order status tracking API", "d": True},
                {"t": "Estimated prep time engine", "d": True},
                {"t": "Order rate limiting (kitchen capacity)", "d": True},
                {"t": "Restaurant order management API", "d": True},
                {"t": "Frontend consumer ordering pages", "d": False},
            ],
        },
    ]

    # Check for duplicates before inserting
    inserted = 0
    for f in new_features:
        exists = await db.project_features.find_one({"name": f["name"]})
        if not exists:
            f["notes"] = []
            f["history"] = [{"action": "created", "stage": f["stage"], "at": now, "by": "System (EPOS migration)"}]
            f["assignee"] = ""
            f["target_date"] = ""
            f["sort_order"] = 0
            f["created_at"] = now
            f["updated_at"] = now
            await db.project_features.insert_one(f)
            inserted += 1
            print(f"  ✅ Added: {f['name']}")
        else:
            print(f"  ⏭️  Skipped (exists): {f['name']}")

    print(f"\n✅ Phase 2: Added {inserted} new EPOS features")

    # ═══════════════════════════════════════════════════════
    # PHASE 3: Count totals
    # ═══════════════════════════════════════════════════════
    total = await db.project_features.count_documents({})
    by_stage = {}
    for stage in ["backlog", "design", "in_progress", "review", "live"]:
        c = await db.project_features.count_documents({"stage": stage})
        by_stage[stage] = c

    epos_count = await db.project_features.count_documents({"cat": "EPOS"})

    print(f"\n📊 Project Board Summary:")
    print(f"   Total features: {total}")
    print(f"   EPOS features: {epos_count}")
    for stage, count in by_stage.items():
        print(f"   {stage}: {count}")

    client.close()


if __name__ == "__main__":
    asyncio.run(run())
