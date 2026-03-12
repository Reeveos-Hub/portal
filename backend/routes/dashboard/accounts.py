"""
Accounts API — Revenue, transactions, tax, and accountant settings.

All financial data is derived from the bookings collection.
Every completed/confirmed booking IS a transaction.

Security:
- Full tenant isolation via verify_business_access
- All queries scoped to business_id
- Accountant email stored per-business
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from datetime import datetime, date, timedelta
from typing import Optional
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/accounts", tags=["accounts"])

VAT_RATE = 0.20  # UK standard VAT rate


def _bid_values(business_id: str):
    vals = [business_id]
    if ObjectId.is_valid(business_id):
        vals.append(ObjectId(business_id))
    return vals


def _get_price(b):
    """Extract price from a booking, handling various field formats."""
    p = b.get("price")
    if p is not None:
        try:
            return float(p)
        except (ValueError, TypeError):
            pass
    svc = b.get("service")
    if isinstance(svc, dict):
        try:
            return float(svc.get("price", 0))
        except (ValueError, TypeError):
            pass
    return 0.0


def _period_dates(period: str):
    """Get start date for the given period."""
    today = date.today()
    if period == "week":
        start = today - timedelta(days=7)
    elif period == "month":
        start = today.replace(day=1)
    elif period == "quarter":
        q_month = ((today.month - 1) // 3) * 3 + 1
        start = today.replace(month=q_month, day=1)
    elif period == "year":
        start = today.replace(month=1, day=1)
    else:
        start = today - timedelta(days=30)
    return start, today


def _prev_period_dates(period: str, current_start: date, current_end: date):
    """Get the equivalent previous period for comparison."""
    delta = (current_end - current_start).days
    prev_end = current_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=delta)
    return prev_start, prev_end


# ═══════════════════════════════════════
# FULL ACCOUNTS SUMMARY (single endpoint, all data)
# ═══════════════════════════════════════

@router.get("/business/{business_id}")
async def get_accounts_summary(
    business_id: str,
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    tenant: TenantContext = Depends(verify_business_access),
):
    """
    Full accounts overview — KPIs, revenue trend, service breakdown,
    recent transactions, and tax summary. Single API call for the page.
    """
    db = get_database()
    bid = tenant.business_id
    bids = _bid_values(bid)

    current_start, current_end = _period_dates(period)
    prev_start, prev_end = _prev_period_dates(period, current_start, current_end)

    # Fetch all bookings for current + previous period
    all_bookings = await db.bookings.find({
        "$or": [{"businessId": {"$in": bids}}, {"business_id": {"$in": bids}}],
        "date": {"$gte": prev_start.isoformat(), "$lte": current_end.isoformat()},
    }).to_list(length=50000)

    # Split into current and previous
    current_bookings = [b for b in all_bookings
                        if (b.get("date") or "") >= current_start.isoformat()
                        and b.get("status") in ("confirmed", "completed", "checked_in")]
    prev_bookings = [b for b in all_bookings
                     if current_start.isoformat() > (b.get("date") or "") >= prev_start.isoformat()
                     and b.get("status") in ("confirmed", "completed", "checked_in")]

    # ─── KPI CALCULATIONS ───
    gross_current = sum(_get_price(b) for b in current_bookings)
    gross_prev = sum(_get_price(b) for b in prev_bookings)

    vat_current = round(gross_current * VAT_RATE / (1 + VAT_RATE), 2)  # Extract VAT from gross (VAT-inclusive)
    net_current = round(gross_current - vat_current, 2)

    count_current = len(current_bookings)
    count_prev = len(prev_bookings)

    def _pct_change(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)

    kpis = {
        "gross_revenue": round(gross_current, 2),
        "gross_change": _pct_change(gross_current, gross_prev),
        "net_revenue": round(net_current, 2),
        "net_change": _pct_change(net_current, sum(_get_price(b) for b in prev_bookings) * (1 / (1 + VAT_RATE))),
        "vat_collected": round(vat_current, 2),
        "transaction_count": count_current,
        "transaction_change": _pct_change(count_current, count_prev),
    }

    # ─── REVENUE TREND (daily) ───
    daily_revenue = {}
    for b in current_bookings:
        d = (b.get("date") or "")[:10]
        if d:
            daily_revenue[d] = daily_revenue.get(d, 0) + _get_price(b)

    # Fill in missing days with 0
    trend = []
    day = current_start
    while day <= current_end:
        ds = day.isoformat()
        trend.append({
            "date": ds,
            "label": day.strftime("%d %b"),
            "revenue": round(daily_revenue.get(ds, 0), 2),
        })
        day += timedelta(days=1)

    # ─── REVENUE BY SERVICE ───
    service_revenue = {}
    for b in current_bookings:
        svc = b.get("service_name", "")
        if isinstance(svc, dict):
            svc = svc.get("name", "Unknown")
        if not svc:
            svc = "Unknown"
        service_revenue[svc] = service_revenue.get(svc, 0) + _get_price(b)

    # Sort by revenue, top 5 + other
    sorted_services = sorted(service_revenue.items(), key=lambda x: x[1], reverse=True)
    total_svc_rev = sum(v for _, v in sorted_services)
    top_services = sorted_services[:5]

    other_rev = sum(v for _, v in sorted_services[5:])
    if other_rev > 0:
        top_services.append(("Other", other_rev))

    services_breakdown = []
    for name, rev in top_services:
        pct = round((rev / total_svc_rev * 100) if total_svc_rev > 0 else 0, 1)
        services_breakdown.append({
            "name": name,
            "revenue": round(rev, 2),
            "percentage": pct,
        })

    # ─── RECENT TRANSACTIONS ───
    # Get last 50 bookings with valid status for the transaction table
    recent_bookings = sorted(
        current_bookings,
        key=lambda b: (b.get("date", ""), b.get("time", "")),
        reverse=True,
    )[:50]

    transactions = []
    for b in recent_bookings:
        svc = b.get("service_name", "")
        if isinstance(svc, dict):
            svc = svc.get("name", "Unknown")

        transactions.append({
            "date": b.get("date", "")[:10] if b.get("date") else "",
            "time": b.get("time", ""),
            "client": b.get("customerName", b.get("customer_name", "Walk-in")),
            "service": svc or "Service",
            "amount": round(_get_price(b), 2),
            "method": b.get("payment_method", "Card"),
            "status": (b.get("status") or "").replace("_", " ").title(),
        })

    # ─── TAX SUMMARY (quarterly) ───
    today = date.today()
    tax_quarters = []
    for q_offset in range(4):
        # Work backwards through quarters
        q_end_month = ((today.month - 1) // 3) * 3 + 3 - (q_offset * 3)
        q_start_month = q_end_month - 2
        q_year = today.year

        # Handle year rollover
        while q_start_month <= 0:
            q_start_month += 12
            q_end_month += 12
            q_year -= 1
        while q_end_month > 12:
            q_end_month -= 12

        # Proper quarter calculation
        actual_year = today.year
        current_q = (today.month - 1) // 3  # 0-based quarter index
        target_q = current_q - q_offset

        target_year = actual_year
        while target_q < 0:
            target_q += 4
            target_year -= 1

        q_start_month = target_q * 3 + 1
        q_end_month = q_start_month + 2

        q_start = date(target_year, q_start_month, 1)
        # End of quarter
        if q_end_month == 12:
            q_end = date(target_year, 12, 31)
        else:
            q_end = date(target_year, q_end_month + 1, 1) - timedelta(days=1)

        q_label = f"Q{target_q + 1} {target_year} ({q_start.strftime('%b')}-{q_end.strftime('%b')})"

        q_bookings = [b for b in all_bookings
                      if q_start.isoformat() <= (b.get("date") or "") <= q_end.isoformat()
                      and b.get("status") in ("confirmed", "completed", "checked_in")]

        # If we don't have data from the all_bookings query (which only covers current+prev period),
        # fetch separately for older quarters
        if q_start.isoformat() < prev_start.isoformat():
            q_bookings = await db.bookings.find({
                "$or": [{"businessId": {"$in": bids}}, {"business_id": {"$in": bids}}],
                "date": {"$gte": q_start.isoformat(), "$lte": q_end.isoformat()},
                "status": {"$in": ["confirmed", "completed", "checked_in"]},
            }).to_list(length=50000)

        q_gross = sum(_get_price(b) for b in q_bookings)
        q_vat = round(q_gross * VAT_RATE / (1 + VAT_RATE), 2)
        q_net = round(q_gross - q_vat, 2)

        tax_quarters.append({
            "label": q_label,
            "gross": round(q_gross, 2),
            "vat": round(q_vat, 2),
            "net": round(q_net, 2),
            "bookings": len(q_bookings),
        })

    # ─── ACCOUNTANT EMAIL ───
    business = await db.businesses.find_one({"_id": bid})
    if not business and ObjectId.is_valid(bid):
        business = await db.businesses.find_one({"_id": ObjectId(bid)})

    accountant_email = ""
    if business:
        accountant_email = business.get("accountant_email", "")

    return {
        "kpis": kpis,
        "trend": trend,
        "services": services_breakdown,
        "transactions": transactions,
        "tax_quarters": tax_quarters,
        "accountant_email": accountant_email,
        "period": period,
    }


# ═══════════════════════════════════════
# SAVE ACCOUNTANT EMAIL
# ═══════════════════════════════════════

@router.put("/business/{business_id}/accountant")
async def save_accountant_email(
    business_id: str,
    body: dict,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Save the accountant email address for this business."""
    db = get_database()
    bid = tenant.business_id

    email = body.get("email", "").strip()
    if not email or "@" not in email:
        raise HTTPException(400, "Valid email address required")

    # Try string ID first, then ObjectId
    result = await db.businesses.update_one(
        {"_id": bid},
        {"$set": {"accountant_email": email, "updated_at": datetime.utcnow().isoformat()}},
    )
    if result.modified_count == 0 and ObjectId.is_valid(bid):
        result = await db.businesses.update_one(
            {"_id": ObjectId(bid)},
            {"$set": {"accountant_email": email, "updated_at": datetime.utcnow().isoformat()}},
        )

    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(404, "Business not found")

    return {"success": True, "email": email}


# ═══════════════════════════════════════
# EXPORT TRANSACTIONS CSV
# ═══════════════════════════════════════

@router.post("/business/{business_id}/export-transactions")
async def export_transactions(
    business_id: str,
    body: dict,
    tenant: TenantContext = Depends(verify_business_access),
):
    """
    Export transactions as CSV and save to Documents.

    Body:
        period: str — week|month|quarter|year
    """
    db = get_database()
    bid = tenant.business_id
    bids = _bid_values(bid)

    period = body.get("period", "month")
    current_start, current_end = _period_dates(period)

    bookings = await db.bookings.find({
        "$or": [{"businessId": {"$in": bids}}, {"business_id": {"$in": bids}}],
        "date": {"$gte": current_start.isoformat(), "$lte": current_end.isoformat()},
        "status": {"$in": ["confirmed", "completed", "checked_in"]},
    }).sort("date", -1).to_list(length=50000)

    if not bookings:
        raise HTTPException(404, "No transactions found for this period")

    # Build CSV
    import csv
    import io

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Time", "Client", "Service", "Amount", "Payment Method", "Status"])

    for b in bookings:
        svc = b.get("service_name", "")
        if isinstance(svc, dict):
            svc = svc.get("name", "Unknown")

        writer.writerow([
            b.get("date", "")[:10],
            b.get("time", ""),
            b.get("customerName", b.get("customer_name", "Walk-in")),
            svc or "Service",
            f"£{_get_price(b):.2f}",
            b.get("payment_method", "Card"),
            (b.get("status") or "").replace("_", " ").title(),
        ])

    file_bytes = output.getvalue().encode("utf-8-sig")

    # Save to Documents
    from routes.dashboard.documents import save_document

    date_label = f"{current_start.strftime('%d %b')} - {current_end.strftime('%d %b %Y')}"
    doc = await save_document(
        db=db,
        business_id=bid,
        name=f"Transactions Export — {date_label}",
        file_bytes=file_bytes,
        format="csv",
        type="export",
        tag="financial",
        created_by=tenant.user_email or "Unknown",
        created_by_type="user",
    )

    return {"success": True, "document": doc, "rows": len(bookings)}


# ═══════════════════════════════════════
# EXPORT TAX SUMMARY PDF
# ═══════════════════════════════════════

@router.post("/business/{business_id}/export-tax")
async def export_tax_summary(
    business_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Generate and save a tax summary PDF to Documents."""
    # Re-use the reports engine for tax_summary
    from routes.dashboard.reports_api import generate_report

    # Build a fake body for the report generator
    body = {
        "report_id": "tax_summary",
        "format": "pdf",
        "date_from": (date.today() - timedelta(days=365)).isoformat(),
        "date_to": date.today().isoformat(),
    }

    # Call the report generator directly
    result = await generate_report(business_id, body, tenant)
    return result
