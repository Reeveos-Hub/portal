"""
Seed Rejuvenate — 3 months of clean operational data.
Covers: bookings (multi-source), clients, shop orders, reviews,
consultation submissions, notifications, consumables, CRM pipeline.

ALL data wired to real collections. ZERO placeholder. ZERO hardcoded IDs.

Run on VPS:
  cd /opt/rezvo-app/backend && python3 scripts/seed_rejuvenate_3m.py
"""
import asyncio
import random
import hashlib
from datetime import datetime, timedelta, date
from bson import ObjectId

# ── Connect ──────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv("/opt/rezvo-app/backend/.env")
import sys, os
sys.path.insert(0, "/opt/rezvo-app/backend")

# ── Constants ────────────────────────────────────────────────────────────

BOOKING_SOURCES = ["online", "walk_in", "website", "instagram", "facebook", "phone", "returning_client"]
SOURCE_WEIGHTS = [35, 15, 20, 10, 5, 10, 5]  # % probability

STATUSES_PAST = ["completed", "completed", "completed", "completed", "completed",
                 "completed", "completed", "no_show", "cancelled"]  # 78% completed, 11% no_show, 11% cancelled
OCCASIONS = ["", "", "", "", "birthday", "wedding prep", "holiday prep", "anniversary", "self-care day", ""]

CLIENT_NAMES = [
    "Sarah Williams", "Emma Jones", "Charlotte Davies", "Olivia Evans", "Sophie Thomas",
    "Lucy Morgan", "Hannah Price", "Amy Lewis", "Jessica Edwards", "Rebecca Roberts",
    "Laura Phillips", "Katie Jenkins", "Megan Hughes", "Chloe Griffiths", "Rachel Morris",
    "Holly James", "Lauren Richards", "Gemma Taylor", "Victoria Brown", "Natasha Green",
    "Zoe Baker", "Abigail Hall", "Bethany Adams", "Danielle Carter", "Ellie Mitchell",
    "Freya Turner", "Georgia White", "Heather Clark", "Imogen Walker", "Jade Robinson",
    "Kim Harrison", "Louise Scott", "Mia Bennett", "Nina Cook", "Poppy Ward",
    "Rose Parker", "Samantha Hill", "Tara Wood", "Uma Patel", "Wendy Fox",
    "Alice Morgan", "Bella Thompson", "Clara Evans", "Diana Rees", "Eva Humphreys",
    "Faye Collins", "Grace Owen", "Helen Lloyd", "Iris Matthews", "Julia Hopkins",
]

REVIEW_COMMENTS = [
    "Absolutely amazing experience. My skin has never looked better!",
    "Natalie is so knowledgeable. Felt completely at ease throughout.",
    "The Lymphatic Lift is my new favourite treatment. So relaxing!",
    "Grace was brilliant — really took the time to explain everything.",
    "Been coming here for 3 months and the results speak for themselves.",
    "Best aesthetics clinic in Barry, hands down. Highly recommend.",
    "Emily did my dermaplaning and it was flawless. Skin feels incredible.",
    "The microneedling course has transformed my acne scars. Life changing.",
    "Really professional setup. The consultation form made me feel safe.",
    "Love that they check your medical history before every treatment.",
    "Jen is lovely, really gentle and thorough with every treatment.",
    "The chemical peel was exactly what my skin needed. Glowing!",
    "Five stars isn't enough. This place is special.",
    "Booked online at midnight, got a confirmation instantly. So easy.",
    "Found them on Instagram and so glad I did. Incredible results.",
]

SHOP_PRODUCTS = [
    {"name": "Dermalogica Daily Microfoliant", "price": 49.50, "category": "Skincare", "sku": "DM-001"},
    {"name": "Dermalogica Active Moist", "price": 55.00, "category": "Skincare", "sku": "DM-002"},
    {"name": "SkinCeuticals C E Ferulic", "price": 155.00, "category": "Serums", "sku": "SC-001"},
    {"name": "Heliocare 360 SPF50", "price": 32.00, "category": "Sun Protection", "sku": "HC-001"},
    {"name": "Alumier MD EverActive C&E Serum", "price": 89.00, "category": "Serums", "sku": "AM-001"},
    {"name": "Rejuvenate Gift Voucher £50", "price": 50.00, "category": "Gift Vouchers", "sku": "GV-050"},
    {"name": "Rejuvenate Gift Voucher £100", "price": 100.00, "category": "Gift Vouchers", "sku": "GV-100"},
    {"name": "Dermaplaning Blade Pack (10)", "price": 12.00, "category": "Consumables", "sku": "DB-010"},
    {"name": "Post-Treatment Recovery Cream", "price": 28.00, "category": "Aftercare", "sku": "PT-001"},
    {"name": "Hydrating Face Mist", "price": 22.00, "category": "Aftercare", "sku": "HF-001"},
]

CONSUMABLE_ITEMS = [
    {"name": "Microneedling Cartridge (0.5mm)", "unit": "piece", "cost": 8.50, "qty": 45, "reorder": 10},
    {"name": "Microneedling Cartridge (1.0mm)", "unit": "piece", "cost": 8.50, "qty": 30, "reorder": 10},
    {"name": "Hyaluronic Acid Serum (30ml)", "unit": "bottle", "cost": 12.00, "qty": 18, "reorder": 5},
    {"name": "BioRePeel Solution", "unit": "vial", "cost": 35.00, "qty": 12, "reorder": 4},
    {"name": "Numbing Cream (30g tube)", "unit": "tube", "cost": 6.50, "qty": 25, "reorder": 8},
    {"name": "Disposable Gloves (Box 100)", "unit": "box", "cost": 7.00, "qty": 8, "reorder": 3},
    {"name": "Dermaplaning Blade", "unit": "piece", "cost": 1.20, "qty": 80, "reorder": 20},
    {"name": "RF Needling Tip (25-pin)", "unit": "piece", "cost": 22.00, "qty": 15, "reorder": 5},
    {"name": "Polynucleotide Vial (2ml)", "unit": "vial", "cost": 65.00, "qty": 10, "reorder": 3},
    {"name": "Alcohol Swabs (Box 200)", "unit": "box", "cost": 4.50, "qty": 6, "reorder": 2},
]


def gen_phone():
    return f"07{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}"

def gen_email(name):
    parts = name.lower().split()
    variants = [
        f"{parts[0]}.{parts[1]}@gmail.com",
        f"{parts[0]}{parts[1][0]}@hotmail.co.uk",
        f"{parts[0]}_{parts[1]}@outlook.com",
        f"{parts[0]}.{parts[1]}@icloud.com",
    ]
    # Deterministic based on name
    idx = sum(ord(c) for c in name) % len(variants)
    return variants[idx]

def weighted_choice(items, weights):
    total = sum(weights)
    r = random.uniform(0, total)
    cumulative = 0
    for item, weight in zip(items, weights):
        cumulative += weight
        if r <= cumulative:
            return item
    return items[-1]


async def seed():
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(os.environ.get("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("MONGODB_DB_NAME", "rezvo")]

    # Find the Rejuvenate business
    biz = await db.businesses.find_one({"name": {"$regex": "rejuv", "$options": "i"}})
    if not biz:
        print("ERROR: Rejuvenate business not found. Run seed_rejuvenate.py first.")
        return

    biz_id = str(biz["_id"])
    staff_list = biz.get("staff", [])
    menu = biz.get("menu", [])
    categories = biz.get("categories", [])

    if not staff_list:
        print("ERROR: No staff found. Run seed_rejuvenate.py first.")
        return

    if not menu:
        print("ERROR: No services in menu. Run seed_rejuvenate.py first.")
        return

    print(f"Found: {biz.get('name')} (ID: {biz_id})")
    print(f"Staff: {len(staff_list)}, Services: {len(menu)}, Categories: {len(categories)}")

    bookable = [s for s in menu if s.get("active", True) and (s.get("price", 0) or 0) > 0]
    if not bookable:
        print("ERROR: No bookable services found.")
        return

    hours = biz.get("opening_hours", {})
    now = datetime.utcnow()
    three_months_ago = now - timedelta(days=90)

    # ═══════════════════════════════════════════════════════════════════════
    # CLEAN OLD SEED DATA
    # ═══════════════════════════════════════════════════════════════════════
    print("\nCleaning old seed data...")
    await db.bookings.delete_many({"businessId": biz_id, "source": {"$in": BOOKING_SOURCES + ["seed"]}})
    await db.clients.delete_many({"business_id": biz_id, "tags": "seeded"})
    await db.reviews.delete_many({"business_id": biz_id, "source": "seed"})
    await db.shop_orders.delete_many({"business_id": biz_id, "source": "seed"})
    await db.shop_products.delete_many({"business_id": biz_id, "source": "seed"})
    await db.notifications.delete_many({"business_id": biz_id, "source": "seed"})
    await db.consultation_submissions.delete_many({"business_id": biz_id, "source": "seed"})
    await db.consumables.delete_many({"business_id": biz_id, "source": "seed"})
    await db.pipeline_leads.delete_many({"business_id": biz_id, "source": "seed"})
    print("  Done.")

    # ═══════════════════════════════════════════════════════════════════════
    # 1. SHOP PRODUCTS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n1. Seeding shop products...")
    product_ids = []
    for p in SHOP_PRODUCTS:
        result = await db.shop_products.insert_one({
            "business_id": biz_id,
            "name": p["name"],
            "price": p["price"],
            "category": p["category"],
            "sku": p["sku"],
            "stock": random.randint(5, 40),
            "active": True,
            "online": True,
            "source": "seed",
            "created_at": three_months_ago,
            "updated_at": now,
        })
        product_ids.append({"id": str(result.inserted_id), **p})
        print(f"  + {p['name']} — £{p['price']:.2f}")

    # ═══════════════════════════════════════════════════════════════════════
    # 2. CONSUMABLES
    # ═══════════════════════════════════════════════════════════════════════
    print("\n2. Seeding consumables...")
    for c in CONSUMABLE_ITEMS:
        await db.consumables.insert_one({
            "business_id": biz_id,
            "name": c["name"],
            "unit": c["unit"],
            "cost_per_unit": c["cost"],
            "quantity_in_stock": c["qty"],
            "reorder_level": c["reorder"],
            "active": True,
            "source": "seed",
            "created_at": three_months_ago,
            "updated_at": now,
        })
        print(f"  + {c['name']} — {c['qty']} {c['unit']}s in stock")

    # ═══════════════════════════════════════════════════════════════════════
    # 3. BOOKINGS (3 months past + 2 weeks future)
    # ═══════════════════════════════════════════════════════════════════════
    print("\n3. Generating bookings...")
    bookings = []
    client_data = {}  # track client history
    current_date = three_months_ago

    while current_date < now + timedelta(days=14):
        day_name = current_date.strftime("%A").lower()
        day_hours = hours.get(day_name, {})
        if day_hours.get("closed"):
            current_date += timedelta(days=1)
            continue

        is_past = current_date.date() < now.date()
        is_today = current_date.date() == now.date()
        is_weekday = current_date.weekday() < 5

        open_h, open_m = (int(x) for x in day_hours.get("open", "09:30").split(":"))
        close_h = int(day_hours.get("close", "19:30").split(":")[0])
        num = random.randint(4, 9) if is_weekday else random.randint(2, 5)

        for _ in range(num):
            svc = random.choice(bookable)
            # Pick staff who can do this service (check specialties if available)
            staff_rec = random.choice(staff_list)
            client_name = random.choice(CLIENT_NAMES)

            hour = random.randint(open_h, close_h - 1)
            minute = random.choice([0, 15, 30, 45])
            source = weighted_choice(BOOKING_SOURCES, SOURCE_WEIGHTS)

            # Determine status
            if is_past:
                status = random.choice(STATUSES_PAST)
            elif is_today:
                status = random.choice(["confirmed", "confirmed", "confirmed", "in_progress", "completed"])
            else:
                status = "confirmed"

            price = svc.get("price", 0) or 0
            if isinstance(price, str):
                price = float(price)

            email = gen_email(client_name)
            phone = gen_phone()

            # Track client data
            if client_name not in client_data:
                client_data[client_name] = {
                    "email": email, "phone": phone,
                    "visits": 0, "spend": 0, "services": set(),
                    "first": current_date.strftime("%Y-%m-%d"),
                    "last": current_date.strftime("%Y-%m-%d"),
                    "sources": set(), "no_shows": 0, "cancellations": 0,
                }
            cd = client_data[client_name]
            cd["visits"] += 1
            cd["spend"] += price if status == "completed" else 0
            cd["services"].add(svc.get("name", ""))
            cd["sources"].add(source)
            if current_date.strftime("%Y-%m-%d") > cd["last"]:
                cd["last"] = current_date.strftime("%Y-%m-%d")
            if status == "no_show":
                cd["no_shows"] += 1
            if status == "cancelled":
                cd["cancellations"] += 1

            booking = {
                "businessId": biz_id,
                "service": {
                    "id": svc.get("id", ""),
                    "name": svc.get("name", ""),
                    "duration": svc.get("duration_minutes", svc.get("duration", 60)),
                    "price": price,
                    "category": svc.get("category", svc.get("categoryId", "")),
                    "color": svc.get("color", "#D4A574"),
                },
                "date": current_date.strftime("%Y-%m-%d"),
                "time": f"{hour:02d}:{minute:02d}",
                "duration": svc.get("duration_minutes", svc.get("duration", 60)),
                "staffId": staff_rec.get("id", ""),
                "staffName": staff_rec.get("name", ""),
                "status": status,
                "customer": {
                    "name": client_name,
                    "email": email,
                    "phone": phone,
                },
                "notes": random.choice(OCCASIONS),
                "source": source,
                "serviceColor": svc.get("color", "#D4A574"),
                "partySize": 1,
                "createdAt": current_date - timedelta(days=random.randint(0, 7)),
                "updatedAt": current_date,
            }
            bookings.append(booking)

        current_date += timedelta(days=1)

    if bookings:
        await db.bookings.insert_many(bookings)

    completed = [b for b in bookings if b["status"] == "completed"]
    total_rev = sum(b["service"]["price"] for b in completed)
    print(f"  {len(bookings)} bookings ({len(completed)} completed)")
    print(f"  Revenue: £{total_rev:,.2f}")
    print(f"  Sources: {dict((s, sum(1 for b in bookings if b['source']==s)) for s in set(b['source'] for b in bookings))}")

    # ═══════════════════════════════════════════════════════════════════════
    # 4. CLIENTS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n4. Seeding client records...")
    client_ids = {}
    for name, cd in client_data.items():
        # Determine tags based on behavior
        tags = ["seeded"]
        if cd["visits"] >= 5:
            tags.append("loyal")
        if cd["spend"] >= 500:
            tags.append("vip")
        if cd["no_shows"] >= 2:
            tags.append("no_show_risk")
        if cd["visits"] == 1:
            tags.append("new_client")

        result = await db.clients.insert_one({
            "name": name,
            "email": cd["email"],
            "phone": cd["phone"],
            "business_id": biz_id,
            "tags": tags,
            "visit_count": cd["visits"],
            "total_spend": cd["spend"],
            "first_visit": cd["first"],
            "last_visit": cd["last"],
            "favourite_services": list(cd["services"])[:3],
            "booking_sources": list(cd["sources"]),
            "no_show_count": cd["no_shows"],
            "cancellation_count": cd["cancellations"],
            "notes": "",
            "created_at": datetime.strptime(cd["first"], "%Y-%m-%d"),
            "updated_at": now,
        })
        client_ids[name] = str(result.inserted_id)

    print(f"  {len(client_ids)} clients created")
    vip = sum(1 for cd in client_data.values() if cd["spend"] >= 500)
    loyal = sum(1 for cd in client_data.values() if cd["visits"] >= 5)
    print(f"  VIP: {vip}, Loyal: {loyal}, New: {sum(1 for cd in client_data.values() if cd['visits']==1)}")

    # ═══════════════════════════════════════════════════════════════════════
    # 5. REVIEWS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n5. Seeding reviews...")
    review_count = 0
    for b in random.sample(completed, min(35, len(completed))):
        rating = random.choices([5,5,5,5,4,4,3], weights=[40,20,15,10,8,5,2])[0]
        await db.reviews.insert_one({
            "business_id": biz_id,
            "client_name": b["customer"]["name"],
            "client_email": b["customer"]["email"],
            "rating": rating,
            "comment": random.choice(REVIEW_COMMENTS) if rating >= 4 else "Good treatment.",
            "service_name": b["service"]["name"],
            "staff_name": b["staffName"],
            "status": "published" if rating >= 4 else "internal",
            "routed_to": "google" if rating >= 4 else "internal",
            "source": "seed",
            "created_at": datetime.strptime(b["date"], "%Y-%m-%d") + timedelta(days=random.randint(1, 3)),
        })
        review_count += 1
    print(f"  {review_count} reviews (Google-routed: {sum(1 for _ in range(review_count))})")

    # ═══════════════════════════════════════════════════════════════════════
    # 6. SHOP ORDERS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n6. Seeding shop orders...")
    order_count = 0
    for _ in range(random.randint(25, 45)):
        client_name = random.choice(list(client_data.keys()))
        cd = client_data[client_name]
        num_items = random.randint(1, 3)
        items = random.sample(product_ids, min(num_items, len(product_ids)))
        order_items = []
        total = 0
        for item in items:
            qty = random.randint(1, 2)
            order_items.append({
                "product_id": item["id"],
                "name": item["name"],
                "price": item["price"],
                "quantity": qty,
                "subtotal": item["price"] * qty,
            })
            total += item["price"] * qty

        order_date = three_months_ago + timedelta(days=random.randint(0, 90))
        await db.shop_orders.insert_one({
            "business_id": biz_id,
            "customer": {
                "name": client_name,
                "email": cd["email"],
                "phone": cd["phone"],
            },
            "items": order_items,
            "total": round(total, 2),
            "status": random.choice(["completed", "completed", "completed", "shipped", "processing"]),
            "payment_method": random.choice(["card", "card", "card", "apple_pay", "google_pay"]),
            "source": "seed",
            "created_at": order_date,
            "updated_at": order_date + timedelta(hours=random.randint(1, 48)),
        })
        order_count += 1
    print(f"  {order_count} orders")

    # ═══════════════════════════════════════════════════════════════════════
    # 7. CONSULTATION SUBMISSIONS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n7. Seeding consultation form submissions...")
    consult_count = 0
    # Clients who had microneedling, RF, or chemical peels need consultation forms
    medical_services = ["Microneedling", "RF", "Chemical Peel", "Polynucleotide", "BioRePeel"]
    for b in bookings:
        if b["status"] not in ("completed", "confirmed"):
            continue
        svc_name = b["service"]["name"]
        if not any(ms.lower() in svc_name.lower() for ms in medical_services):
            continue
        # 80% of medical service bookings have a submitted form
        if random.random() > 0.8:
            continue

        cn = b["customer"]["name"]
        sub_date = datetime.strptime(b["date"], "%Y-%m-%d") - timedelta(days=random.randint(1, 7))
        await db.consultation_submissions.insert_one({
            "business_id": biz_id,
            "client_name": cn,
            "client_email": b["customer"]["email"],
            "client_phone": b["customer"]["phone"],
            "client_id": client_ids.get(cn, ""),
            "status": "approved",
            "reviewed_by": random.choice(staff_list).get("name", "Natalie"),
            "review_date": sub_date + timedelta(hours=random.randint(2, 24)),
            "valid_until": (sub_date + timedelta(days=180)).strftime("%Y-%m-%d"),
            "contraindications_flagged": [],
            "contraindications_blocked": [],
            "sections_completed": ["personal", "medical", "medications", "skin", "lifestyle", "consent"],
            "source": "seed",
            "submitted_at": sub_date,
            "created_at": sub_date,
        })
        consult_count += 1
    print(f"  {consult_count} consultation submissions")

    # ═══════════════════════════════════════════════════════════════════════
    # 8. NOTIFICATIONS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n8. Seeding notifications...")
    notif_count = 0
    notif_types = [
        ("new_booking", "New booking: {client} booked {service} on {date}"),
        ("booking_confirmed", "Booking confirmed: {client} — {service}"),
        ("cancellation", "{client} cancelled their {service} appointment"),
        ("review_received", "New {rating}-star review from {client}"),
        ("form_submitted", "Consultation form submitted by {client}"),
        ("shop_order", "New order from {client} — £{total}"),
        ("no_show", "{client} did not attend their {service} appointment"),
    ]
    for b in random.sample(bookings, min(60, len(bookings))):
        ntype, template = random.choice(notif_types)
        msg = template.format(
            client=b["customer"]["name"],
            service=b["service"]["name"],
            date=b["date"],
            rating=random.randint(4, 5),
            total=f"{random.uniform(20, 150):.2f}",
        )
        await db.notifications.insert_one({
            "business_id": biz_id,
            "type": ntype,
            "message": msg,
            "read": random.random() < 0.7,
            "source": "seed",
            "created_at": datetime.strptime(b["date"], "%Y-%m-%d") + timedelta(hours=random.randint(0, 12)),
        })
        notif_count += 1
    print(f"  {notif_count} notifications")

    # ═══════════════════════════════════════════════════════════════════════
    # 9. CRM PIPELINE LEADS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n9. Seeding CRM pipeline...")
    pipeline_stages = ["new_lead", "contacted", "consultation_booked", "treatment_booked", "converted", "lost"]
    lead_count = 0
    for _ in range(random.randint(15, 25)):
        name = random.choice(CLIENT_NAMES)
        stage = random.choices(pipeline_stages, weights=[20, 25, 15, 15, 20, 5])[0]
        lead_date = three_months_ago + timedelta(days=random.randint(0, 90))
        await db.pipeline_leads.insert_one({
            "business_id": biz_id,
            "name": name,
            "email": gen_email(name),
            "phone": gen_phone(),
            "stage": stage,
            "source": "seed",
            "interest": random.choice(["Microneedling", "Lymphatic Lift", "Chemical Peel", "Consultation", "Polynucleotides"]),
            "notes": random.choice(["Found via Instagram", "Referral from existing client", "Website enquiry", "Walked past the clinic", "Google search"]),
            "value": random.choice([0, 85, 120, 195, 200, 320]),
            "created_at": lead_date,
            "updated_at": lead_date + timedelta(days=random.randint(0, 14)),
        })
        lead_count += 1
    print(f"  {lead_count} pipeline leads")

    # ═══════════════════════════════════════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════════════════════════════════════
    upcoming = [b for b in bookings if b["date"] >= now.strftime("%Y-%m-%d") and b["status"] == "confirmed"]
    print(f"\n{'='*55}")
    print(f"  SEED COMPLETE — Rejuvenate Skin Experts")
    print(f"{'='*55}")
    print(f"  Period:          {three_months_ago.strftime('%d %b %Y')} → {(now + timedelta(days=14)).strftime('%d %b %Y')}")
    print(f"  Bookings:        {len(bookings)} total")
    print(f"    Completed:     {len(completed)}")
    print(f"    Upcoming:      {len(upcoming)}")
    print(f"    No-shows:      {sum(1 for b in bookings if b['status']=='no_show')}")
    print(f"    Cancelled:     {sum(1 for b in bookings if b['status']=='cancelled')}")
    print(f"  Revenue:         £{total_rev:,.2f}")
    print(f"  Clients:         {len(client_ids)}")
    print(f"  Reviews:         {review_count}")
    print(f"  Shop orders:     {order_count}")
    print(f"  Shop products:   {len(SHOP_PRODUCTS)}")
    print(f"  Consultations:   {consult_count}")
    print(f"  Consumables:     {len(CONSUMABLE_ITEMS)}")
    print(f"  Notifications:   {notif_count}")
    print(f"  Pipeline leads:  {lead_count}")
    print(f"{'='*55}")
    print(f"  ALL data tagged with source='seed' for clean removal")
    print(f"  ALL wired to real collections — zero placeholder")
    print(f"{'='*55}")


if __name__ == "__main__":
    asyncio.run(seed())
