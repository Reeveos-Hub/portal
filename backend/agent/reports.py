"""
ReeveOS Report Framework
=========================
Central registry of all reports the AI (and dashboard) can generate.
Each report defines: what data it queries, what fields to include,
how to format it, and what output formats are supported.

The AI's generate_report tool picks from this registry.
The backend report_generator module uses these definitions to build files.

GOLDEN RULE: Reports are READ-ONLY exports. They never modify data.
"""

from datetime import date, timedelta
from typing import Optional, List, Dict, Any


# ═══════════════════════════════════════
# REPORT REGISTRY
# ═══════════════════════════════════════

REPORT_REGISTRY: Dict[str, Dict[str, Any]] = {}


def register_report(
    report_id: str,
    name: str,
    description: str,
    category: str,
    collection: str,
    query_builder,
    fields: List[Dict[str, str]],
    formats: List[str] = None,
    summary_builder=None,
    requires_date_range: bool = True,
    default_period_days: int = 30,
    max_rows: int = 5000,
    sort_field: str = None,
    sort_direction: int = -1,
):
    """
    Register a report definition.

    Args:
        report_id: Unique ID (e.g. "bookings_summary")
        name: Human-readable name
        description: What the AI sees — plain English description of the report
        category: reports | exports | forms | financial
        collection: Primary MongoDB collection to query
        query_builder: async fn(db, business_id, params) → MongoDB query dict
        fields: List of {key, label, format} — columns in the report
        formats: Supported output formats (default: all)
        summary_builder: Optional async fn(db, business_id, data) → summary dict (totals, averages)
        requires_date_range: Whether the report needs from/to dates
        default_period_days: Default lookback period
        max_rows: Safety cap on rows returned
        sort_field: Default sort field
        sort_direction: 1=asc, -1=desc
    """
    REPORT_REGISTRY[report_id] = {
        "id": report_id,
        "name": name,
        "description": description,
        "category": category,
        "collection": collection,
        "query_builder": query_builder,
        "fields": fields,
        "formats": formats or ["csv", "docx", "pdf"],
        "summary_builder": summary_builder,
        "requires_date_range": requires_date_range,
        "default_period_days": default_period_days,
        "max_rows": max_rows,
        "sort_field": sort_field,
        "sort_direction": sort_direction,
    }


def get_report(report_id: str) -> Optional[Dict]:
    return REPORT_REGISTRY.get(report_id)


def list_reports(category: str = None) -> List[Dict]:
    """List available reports, optionally filtered by category."""
    reports = []
    for r in REPORT_REGISTRY.values():
        if category and r["category"] != category:
            continue
        reports.append({
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "category": r["category"],
            "formats": r["formats"],
            "requires_date_range": r["requires_date_range"],
        })
    return reports


# ═══════════════════════════════════════
# FIELD FORMAT TYPES
# ═══════════════════════════════════════
# Used by report generators to format values correctly
#
# "text"     → raw string
# "currency" → £XX.XX
# "date"     → DD MMM YYYY
# "datetime" → DD MMM YYYY HH:MM
# "time"     → HH:MM
# "number"   → integer
# "percent"  → XX%
# "phone"    → raw (no formatting)
# "email"    → raw
# "status"   → capitalised badge
# "list"     → comma-separated


# ═══════════════════════════════════════
# QUERY BUILDERS
# ═══════════════════════════════════════
# Each returns a MongoDB query dict scoped to business_id

async def _bookings_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["date"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("date", {})["$lte"] = params["date_to"]
    if params.get("status"):
        q["status"] = params["status"]
    if params.get("staff"):
        q["$or"] = [{"staffName": params["staff"]}, {"staff_name": params["staff"]}]
    return q


async def _clients_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("segment"):
        q["segment"] = params["segment"]
    if params.get("min_visits"):
        q["visits"] = {"$gte": params["min_visits"]}
    if params.get("inactive_days"):
        cutoff = (date.today() - timedelta(days=params["inactive_days"])).isoformat()
        q["last_visit"] = {"$lt": cutoff}
    return q


async def _revenue_query(db, business_id, params):
    q = {
        "business_id": business_id,
        "status": {"$in": ["confirmed", "completed", "checked_in"]},
    }
    if params.get("date_from"):
        q["date"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("date", {})["$lte"] = params["date_to"]
    return q


async def _staff_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("active_only", True):
        q["active"] = {"$ne": False}
    return q


async def _services_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("active_only", True):
        q["active"] = {"$ne": False}
    if params.get("category"):
        q["category"] = params["category"]
    return q


async def _consultation_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    if params.get("reviewed") is not None:
        q["reviewed"] = params["reviewed"]
    return q


async def _transactions_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    if params.get("payment_method"):
        q["payment_method"] = params["payment_method"]
    return q


async def _activity_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["timestamp"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("timestamp", {})["$lte"] = params["date_to"]
    if params.get("type"):
        q["type"] = params["type"]
    return q


# ─── NO-SHOW / CANCELLATION QUERIES ───

async def _no_show_query(db, business_id, params):
    q = {"business_id": business_id, "status": {"$in": ["no_show", "no-show"]}}
    if params.get("date_from"):
        q["date"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("date", {})["$lte"] = params["date_to"]
    return q


async def _no_show_summary(db, business_id, data):
    total = len(data)
    lost_revenue = sum(d.get("price", 0) for d in data)
    return {
        "Total No-Shows": total,
        "Lost Revenue": f"£{lost_revenue:,.2f}",
        "Avg Booking Value": f"£{lost_revenue / max(total, 1):,.2f}",
    }


async def _cancellation_query(db, business_id, params):
    q = {"business_id": business_id, "status": "cancelled"}
    if params.get("date_from"):
        q["date"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("date", {})["$lte"] = params["date_to"]
    return q


async def _cancellation_summary(db, business_id, data):
    total = len(data)
    lost_revenue = sum(d.get("price", 0) for d in data)
    return {
        "Total Cancellations": total,
        "Lost Revenue": f"£{lost_revenue:,.2f}",
        "Avg Booking Value": f"£{lost_revenue / max(total, 1):,.2f}",
    }


# ─── REVIEWS QUERIES ───

async def _reviews_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("min_rating"):
        q["rating"] = {"$gte": params["min_rating"]}
    return q


async def _reviews_summary(db, business_id, data):
    total = len(data)
    avg_rating = sum(d.get("rating", 0) for d in data) / max(total, 1)
    replied = sum(1 for d in data if d.get("owner_reply"))
    five_star = sum(1 for d in data if d.get("rating") == 5)
    return {
        "Total Reviews": total,
        "Average Rating": f"{avg_rating:.1f} / 5",
        "5-Star Reviews": five_star,
        "Replied To": replied,
        "Reply Rate": f"{(replied / max(total, 1)) * 100:.0f}%",
    }


# ─── ORDER QUERIES (RESTAURANT) ───

async def _orders_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    if params.get("order_type"):
        q["order_type"] = params["order_type"]
    if params.get("status"):
        q["status"] = params["status"]
    return q


async def _orders_summary(db, business_id, data):
    total = len(data)
    revenue = sum(d.get("total", 0) for d in data)
    types = {}
    for d in data:
        t = d.get("order_type", "unknown")
        types[t] = types.get(t, 0) + 1
    return {
        "Total Orders": total,
        "Total Revenue": f"£{revenue:,.2f}",
        "Avg Order Value": f"£{revenue / max(total, 1):,.2f}",
        **{f"{k.replace('_', ' ').title()} Orders": v for k, v in types.items()},
    }


# ─── CAMPAIGNS QUERIES ───

async def _campaigns_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ─── PACKAGE QUERIES ───

async def _packages_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("active_only", False):
        q["active"] = True
    return q


async def _client_packages_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ─── CONSUMABLES QUERIES ───

async def _consumables_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("category"):
        q["category"] = params["category"]
    return q


async def _consumable_log_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["timestamp"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("timestamp", {})["$lte"] = params["date_to"]
    return q


# ─── SHOP QUERIES ───

async def _shop_products_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("category"):
        q["category"] = params["category"]
    if params.get("status"):
        q["status"] = params["status"]
    return q


async def _shop_orders_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ─── LOYALTY QUERIES ───

async def _loyalty_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("tier"):
        q["tier"] = params["tier"]
    return q


# ─── SHIFTS / ROTA QUERIES ───

async def _shifts_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["date"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("date", {})["$lte"] = params["date_to"]
    if params.get("staff_name"):
        q["staff_name"] = params["staff_name"]
    return q


# ─── CRM / LEADS QUERIES ───

async def _leads_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    if params.get("source"):
        q["source"] = params["source"]
    return q


# ─── BLOG QUERIES ───

async def _blog_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ─── NOTIFICATIONS QUERIES ───

async def _notifications_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    if params.get("type"):
        q["type"] = params["type"]
    return q


# ─── DELIVERY QUERIES ───

async def _delivery_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ─── ABANDONED CART QUERIES ───

async def _abandoned_cart_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    return q


# ─── WAITLIST QUERIES ───

async def _waitlist_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("date_from"):
        q["created_at"] = {"$gte": params["date_from"]}
    if params.get("date_to"):
        q.setdefault("created_at", {})["$lte"] = params["date_to"]
    return q


# ─── VIDEO MEETING QUERIES ───

async def _video_meetings_query(db, business_id, params):
    q = {"business_id": business_id}
    if params.get("status"):
        q["status"] = params["status"]
    return q


# ═══════════════════════════════════════
# SUMMARY BUILDERS
# ═══════════════════════════════════════
# Generate totals/averages appended to the report

async def _bookings_summary(db, business_id, data):
    total = len(data)
    confirmed = sum(1 for d in data if d.get("status") == "confirmed")
    completed = sum(1 for d in data if d.get("status") == "completed")
    cancelled = sum(1 for d in data if d.get("status") == "cancelled")
    revenue = sum(d.get("price", 0) for d in data)
    return {
        "Total Bookings": total,
        "Confirmed": confirmed,
        "Completed": completed,
        "Cancelled": cancelled,
        "Total Revenue": f"£{revenue:,.2f}",
        "Average Booking Value": f"£{revenue / max(total, 1):,.2f}",
        "Completion Rate": f"{(completed / max(total, 1)) * 100:.0f}%",
    }


async def _clients_summary(db, business_id, data):
    total = len(data)
    total_spend = sum(d.get("total_spend", 0) for d in data)
    total_visits = sum(d.get("visits", 0) for d in data)
    return {
        "Total Clients": total,
        "Total Lifetime Spend": f"£{total_spend:,.2f}",
        "Average Spend per Client": f"£{total_spend / max(total, 1):,.2f}",
        "Total Visits": total_visits,
        "Average Visits per Client": f"{total_visits / max(total, 1):.1f}",
    }


async def _revenue_summary(db, business_id, data):
    total = sum(d.get("price", 0) for d in data)
    count = len(data)
    # Group by service
    by_service = {}
    for d in data:
        svc = d.get("service_name", d.get("service", "Unknown"))
        if isinstance(svc, dict):
            svc = svc.get("name", "Unknown")
        by_service[svc] = by_service.get(svc, 0) + d.get("price", 0)
    top_service = max(by_service.items(), key=lambda x: x[1])[0] if by_service else "N/A"
    return {
        "Total Revenue": f"£{total:,.2f}",
        "Total Bookings": count,
        "Average Booking Value": f"£{total / max(count, 1):,.2f}",
        "Top Revenue Service": top_service,
    }


# ═══════════════════════════════════════
# REGISTER ALL REPORTS
# ═══════════════════════════════════════

def register_all_reports():
    """Register every available report. Called at startup."""

    # ─── BOOKING REPORTS ───

    register_report(
        "bookings_full",
        "Bookings Report",
        "Full list of bookings with customer, service, staff, status, and price. Filter by date range, status, or staff member.",
        "reports",
        "bookings",
        _bookings_query,
        [
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "time", "label": "Time", "format": "time"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "price", "label": "Price", "format": "currency"},
            {"key": "phone", "label": "Phone", "format": "phone"},
        ],
        summary_builder=_bookings_summary,
        sort_field="date",
    )

    register_report(
        "bookings_export",
        "Bookings Export",
        "Raw bookings data export for spreadsheets. All fields included.",
        "exports",
        "bookings",
        _bookings_query,
        [
            {"key": "_id", "label": "Booking ID", "format": "text"},
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "time", "label": "Time", "format": "time"},
            {"key": "customerName", "label": "Client Name", "format": "text"},
            {"key": "customer.email", "label": "Client Email", "format": "email"},
            {"key": "customer.phone", "label": "Client Phone", "format": "phone"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "price", "label": "Price", "format": "currency"},
            {"key": "duration", "label": "Duration (min)", "format": "number"},
            {"key": "notes", "label": "Notes", "format": "text"},
            {"key": "createdAt", "label": "Created", "format": "datetime"},
        ],
        formats=["csv"],
        sort_field="date",
    )

    register_report(
        "daily_summary",
        "Daily Summary Report",
        "Summary of a single day: bookings, revenue, staff performance, services breakdown.",
        "reports",
        "bookings",
        _bookings_query,
        [
            {"key": "time", "label": "Time", "format": "time"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "price", "label": "Price", "format": "currency"},
        ],
        summary_builder=_bookings_summary,
        requires_date_range=False,
        default_period_days=1,
        sort_field="time",
        sort_direction=1,
    )

    # ─── CLIENT REPORTS ───

    register_report(
        "clients_full",
        "Client List",
        "Complete client list with contact details, visit count, total spend, and last visit date.",
        "reports",
        "clients",
        _clients_query,
        [
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "visits", "label": "Visits", "format": "number"},
            {"key": "total_spend", "label": "Total Spend", "format": "currency"},
            {"key": "last_visit", "label": "Last Visit", "format": "date"},
            {"key": "segment", "label": "Segment", "format": "status"},
            {"key": "tags", "label": "Tags", "format": "list"},
        ],
        summary_builder=_clients_summary,
        requires_date_range=False,
        sort_field="last_visit",
    )

    register_report(
        "clients_export",
        "Client Export",
        "Raw client data export with all fields for spreadsheets or CRM import.",
        "exports",
        "clients",
        _clients_query,
        [
            {"key": "_id", "label": "Client ID", "format": "text"},
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "visits", "label": "Visits", "format": "number"},
            {"key": "total_spend", "label": "Total Spend", "format": "currency"},
            {"key": "last_visit", "label": "Last Visit", "format": "date"},
            {"key": "segment", "label": "Segment", "format": "text"},
            {"key": "tags", "label": "Tags", "format": "list"},
            {"key": "notes", "label": "Notes", "format": "text"},
            {"key": "createdAt", "label": "Created", "format": "datetime"},
        ],
        formats=["csv"],
        requires_date_range=False,
        sort_field="name",
        sort_direction=1,
    )

    register_report(
        "clients_inactive",
        "Inactive Clients Report",
        "Clients who haven't visited in a specified number of days. Great for rebooking campaigns.",
        "reports",
        "clients",
        _clients_query,
        [
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "last_visit", "label": "Last Visit", "format": "date"},
            {"key": "visits", "label": "Total Visits", "format": "number"},
            {"key": "total_spend", "label": "Lifetime Spend", "format": "currency"},
        ],
        requires_date_range=False,
        sort_field="last_visit",
    )

    register_report(
        "clients_top_spenders",
        "Top Spending Clients",
        "Clients ranked by total lifetime spend. Identify VIPs and high-value clients.",
        "reports",
        "clients",
        _clients_query,
        [
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "total_spend", "label": "Lifetime Spend", "format": "currency"},
            {"key": "visits", "label": "Visits", "format": "number"},
            {"key": "last_visit", "label": "Last Visit", "format": "date"},
        ],
        requires_date_range=False,
        sort_field="total_spend",
    )

    # ─── REVENUE / FINANCIAL REPORTS ───

    register_report(
        "revenue_summary",
        "Revenue Summary",
        "Revenue breakdown by period with totals, averages, and comparison to previous period. Shows revenue per service and per staff member.",
        "financial",
        "bookings",
        _revenue_query,
        [
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "price", "label": "Amount", "format": "currency"},
            {"key": "status", "label": "Status", "format": "status"},
        ],
        summary_builder=_revenue_summary,
        sort_field="date",
    )

    register_report(
        "revenue_by_service",
        "Revenue by Service",
        "Revenue broken down by service/treatment type. See which services generate the most income.",
        "financial",
        "bookings",
        _revenue_query,
        [
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "count", "label": "Bookings", "format": "number"},
            {"key": "revenue", "label": "Revenue", "format": "currency"},
            {"key": "avg_price", "label": "Avg Price", "format": "currency"},
        ],
        requires_date_range=True,
        sort_field="revenue",
    )

    register_report(
        "revenue_by_staff",
        "Revenue by Staff Member",
        "Revenue broken down by staff member. Track individual performance and earnings.",
        "financial",
        "bookings",
        _revenue_query,
        [
            {"key": "staff_name", "label": "Staff Member", "format": "text"},
            {"key": "count", "label": "Bookings", "format": "number"},
            {"key": "revenue", "label": "Revenue", "format": "currency"},
            {"key": "avg_price", "label": "Avg Booking", "format": "currency"},
        ],
        requires_date_range=True,
        sort_field="revenue",
    )

    register_report(
        "tax_summary",
        "VAT / Tax Summary",
        "Revenue totals by month for tax filing. Shows gross revenue, estimated VAT, and net amounts.",
        "financial",
        "bookings",
        _revenue_query,
        [
            {"key": "month", "label": "Month", "format": "text"},
            {"key": "gross_revenue", "label": "Gross Revenue", "format": "currency"},
            {"key": "vat_amount", "label": "VAT (20%)", "format": "currency"},
            {"key": "net_revenue", "label": "Net Revenue", "format": "currency"},
            {"key": "booking_count", "label": "Bookings", "format": "number"},
        ],
        default_period_days=365,
        sort_field="month",
        sort_direction=1,
    )

    # ─── STAFF REPORTS ───

    register_report(
        "staff_list",
        "Staff Directory",
        "Complete staff list with roles and contact details.",
        "reports",
        "staff",
        _staff_query,
        [
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "role", "label": "Role", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "active", "label": "Active", "format": "status"},
        ],
        requires_date_range=False,
        sort_field="name",
        sort_direction=1,
    )

    register_report(
        "staff_performance",
        "Staff Performance Report",
        "Bookings and revenue per staff member for a date range. Includes completion rates.",
        "reports",
        "bookings",
        _bookings_query,
        [
            {"key": "staff_name", "label": "Staff Member", "format": "text"},
            {"key": "total_bookings", "label": "Total Bookings", "format": "number"},
            {"key": "completed", "label": "Completed", "format": "number"},
            {"key": "cancelled", "label": "Cancelled", "format": "number"},
            {"key": "revenue", "label": "Revenue", "format": "currency"},
            {"key": "completion_rate", "label": "Completion Rate", "format": "percent"},
        ],
        sort_field="revenue",
    )

    # ─── SERVICE REPORTS ───

    register_report(
        "services_list",
        "Services Menu",
        "Complete list of services/treatments with pricing and duration.",
        "reports",
        "services",
        _services_query,
        [
            {"key": "name", "label": "Service", "format": "text"},
            {"key": "category", "label": "Category", "format": "text"},
            {"key": "price", "label": "Price", "format": "currency"},
            {"key": "duration", "label": "Duration (min)", "format": "number"},
            {"key": "active", "label": "Active", "format": "status"},
        ],
        requires_date_range=False,
        sort_field="category",
        sort_direction=1,
    )

    register_report(
        "services_popularity",
        "Service Popularity Report",
        "Services ranked by number of bookings. Shows booking count, revenue, and average price.",
        "reports",
        "bookings",
        _revenue_query,
        [
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "count", "label": "Bookings", "format": "number"},
            {"key": "revenue", "label": "Revenue", "format": "currency"},
            {"key": "avg_price", "label": "Avg Price", "format": "currency"},
            {"key": "pct", "label": "% of Total", "format": "percent"},
        ],
        sort_field="count",
    )

    # ─── CONSULTATION FORM REPORTS ───

    register_report(
        "consultation_submissions",
        "Consultation Form Submissions",
        "All consultation form submissions with status, review state, and expiry dates.",
        "forms",
        "consultation_submissions",
        _consultation_query,
        [
            {"key": "client_name", "label": "Client", "format": "text"},
            {"key": "client_email", "label": "Email", "format": "email"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "reviewed", "label": "Reviewed", "format": "status"},
            {"key": "submitted_at", "label": "Submitted", "format": "datetime"},
            {"key": "expires_at", "label": "Expires", "format": "datetime"},
        ],
        requires_date_range=False,
        sort_field="submitted_at",
    )

    register_report(
        "consultation_flagged",
        "Flagged Consultation Forms",
        "Consultation forms that have been flagged or blocked by the contraindication check. Requires immediate review.",
        "forms",
        "consultation_submissions",
        _consultation_query,
        [
            {"key": "client_name", "label": "Client", "format": "text"},
            {"key": "client_email", "label": "Email", "format": "email"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "treatment_flags", "label": "Flags", "format": "list"},
            {"key": "submitted_at", "label": "Submitted", "format": "datetime"},
        ],
        requires_date_range=False,
        sort_field="submitted_at",
    )

    # ─── ACTIVITY / AUDIT REPORTS ───

    register_report(
        "activity_log",
        "Activity Log",
        "Full audit trail of all actions taken in the business — bookings, status changes, check-ins, cancellations.",
        "reports",
        "activity_log",
        _activity_query,
        [
            {"key": "timestamp", "label": "Time", "format": "datetime"},
            {"key": "type", "label": "Type", "format": "status"},
            {"key": "message", "label": "Description", "format": "text"},
            {"key": "user_email", "label": "By", "format": "email"},
        ],
        sort_field="timestamp",
    )

    # ─── BOOKING SUBSET REPORTS ───

    register_report(
        "bookings_no_shows",
        "No-Show Report",
        "Clients who booked but didn't attend. Useful for enforcing booking fee policies.",
        "reports",
        "bookings",
        _no_show_query,
        [
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "time", "label": "Time", "format": "time"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "price", "label": "Lost Revenue", "format": "currency"},
            {"key": "phone", "label": "Phone", "format": "phone"},
        ],
        summary_builder=_no_show_summary,
        sort_field="date",
    )

    register_report(
        "bookings_cancellations",
        "Cancellations Report",
        "All cancelled bookings with reason and timing. Track cancellation patterns.",
        "reports",
        "bookings",
        _cancellation_query,
        [
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "time", "label": "Time", "format": "time"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "staffName", "label": "Staff", "format": "text"},
            {"key": "price", "label": "Lost Revenue", "format": "currency"},
            {"key": "cancelled_at", "label": "Cancelled", "format": "datetime"},
        ],
        summary_builder=_cancellation_summary,
        sort_field="date",
    )

    register_report(
        "bookings_by_source",
        "Bookings by Source",
        "Where bookings come from — online, phone, walk-in, Google, Instagram.",
        "reports",
        "bookings",
        _bookings_query,
        [
            {"key": "source", "label": "Source", "format": "status"},
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "customerName", "label": "Client", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "price", "label": "Amount", "format": "currency"},
        ],
        sort_field="date",
    )

    # ─── REVIEWS REPORTS ───

    register_report(
        "reviews_full",
        "Reviews Report",
        "All customer reviews with ratings, comments, and response status.",
        "reports",
        "reviews",
        _reviews_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "rating", "label": "Rating", "format": "number"},
            {"key": "body", "label": "Comment", "format": "text"},
            {"key": "owner_reply", "label": "Reply", "format": "text"},
            {"key": "user_id", "label": "Reviewer", "format": "text"},
        ],
        summary_builder=_reviews_summary,
        requires_date_range=False,
        sort_field="created_at",
    )

    # ─── ORDER REPORTS (RESTAURANT) ───

    register_report(
        "orders_full",
        "Orders Report",
        "All restaurant orders with items, totals, type, and status.",
        "reports",
        "orders",
        _orders_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "order_number", "label": "Order #", "format": "text"},
            {"key": "order_type", "label": "Type", "format": "status"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "total", "label": "Total", "format": "currency"},
        ],
        summary_builder=_orders_summary,
        sort_field="created_at",
    )

    register_report(
        "orders_export",
        "Orders Export",
        "Raw order data export with all fields for spreadsheets.",
        "exports",
        "orders",
        _orders_query,
        [
            {"key": "_id", "label": "Order ID", "format": "text"},
            {"key": "order_number", "label": "Order #", "format": "text"},
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "order_type", "label": "Type", "format": "status"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "total", "label": "Total", "format": "currency"},
            {"key": "items", "label": "Items", "format": "list"},
        ],
        formats=["csv"],
        sort_field="created_at",
    )

    # ─── MARKETING / CAMPAIGNS REPORTS ───

    register_report(
        "campaigns_full",
        "Marketing Campaigns",
        "All email campaigns with send count, open rate, and click rate.",
        "reports",
        "campaigns",
        _campaigns_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "name", "label": "Campaign", "format": "text"},
            {"key": "subject", "label": "Subject", "format": "text"},
            {"key": "type", "label": "Type", "format": "status"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "sent_count", "label": "Sent", "format": "number"},
            {"key": "open_count", "label": "Opened", "format": "number"},
            {"key": "click_count", "label": "Clicked", "format": "number"},
        ],
        requires_date_range=False,
        sort_field="created_at",
    )

    # ─── PACKAGE REPORTS ───

    register_report(
        "packages_list",
        "Packages List",
        "All service packages with pricing, sessions, and active status.",
        "reports",
        "package_templates",
        _packages_query,
        [
            {"key": "name", "label": "Package", "format": "text"},
            {"key": "price", "label": "Price", "format": "currency"},
            {"key": "sessions", "label": "Sessions", "format": "number"},
            {"key": "active", "label": "Active", "format": "status"},
            {"key": "created_at", "label": "Created", "format": "datetime"},
        ],
        requires_date_range=False,
        sort_field="name",
        sort_direction=1,
    )

    register_report(
        "packages_sold",
        "Packages Sold",
        "Client package purchases with usage and remaining sessions.",
        "reports",
        "client_packages",
        _client_packages_query,
        [
            {"key": "client_name", "label": "Client", "format": "text"},
            {"key": "package_name", "label": "Package", "format": "text"},
            {"key": "sessions_total", "label": "Total", "format": "number"},
            {"key": "sessions_used", "label": "Used", "format": "number"},
            {"key": "sessions_remaining", "label": "Remaining", "format": "number"},
            {"key": "purchased_at", "label": "Purchased", "format": "datetime"},
            {"key": "status", "label": "Status", "format": "status"},
        ],
        requires_date_range=False,
        sort_field="purchased_at",
    )

    # ─── CONSUMABLES / INVENTORY REPORTS ───

    register_report(
        "consumables_list",
        "Consumables Inventory",
        "Full stock list with quantities, costs, and reorder levels.",
        "reports",
        "consumables",
        _consumables_query,
        [
            {"key": "name", "label": "Item", "format": "text"},
            {"key": "category", "label": "Category", "format": "text"},
            {"key": "quantity", "label": "Qty", "format": "number"},
            {"key": "unit", "label": "Unit", "format": "text"},
            {"key": "cost", "label": "Cost", "format": "currency"},
            {"key": "supplier", "label": "Supplier", "format": "text"},
            {"key": "reorder_level", "label": "Reorder At", "format": "number"},
        ],
        requires_date_range=False,
        sort_field="name",
        sort_direction=1,
    )

    register_report(
        "consumables_usage",
        "Consumables Usage Log",
        "Track what was used, when, and by whom. Identify waste and usage patterns.",
        "reports",
        "consumable_log",
        _consumable_log_query,
        [
            {"key": "timestamp", "label": "Date", "format": "datetime"},
            {"key": "item_name", "label": "Item", "format": "text"},
            {"key": "quantity", "label": "Qty Used", "format": "number"},
            {"key": "used_by", "label": "Staff", "format": "text"},
            {"key": "service_name", "label": "Service", "format": "text"},
        ],
        sort_field="timestamp",
    )

    # ─── SHOP REPORTS ───

    register_report(
        "shop_products",
        "Shop Products",
        "Full product catalogue with pricing, stock levels, and status.",
        "reports",
        "shop_products",
        _shop_products_query,
        [
            {"key": "name", "label": "Product", "format": "text"},
            {"key": "category", "label": "Category", "format": "text"},
            {"key": "price", "label": "Price", "format": "currency"},
            {"key": "stock", "label": "Stock", "format": "number"},
            {"key": "sku", "label": "SKU", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
        ],
        requires_date_range=False,
        sort_field="name",
        sort_direction=1,
    )

    register_report(
        "shop_orders",
        "Shop Orders",
        "All shop/product orders with customer, items, and totals.",
        "reports",
        "shop_orders",
        _shop_orders_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "customer_name", "label": "Customer", "format": "text"},
            {"key": "items", "label": "Items", "format": "list"},
            {"key": "total", "label": "Total", "format": "currency"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "payment_status", "label": "Payment", "format": "status"},
        ],
        sort_field="created_at",
    )

    # ─── LOYALTY REPORTS ───

    register_report(
        "loyalty_members",
        "Loyalty Members",
        "All loyalty programme members with points, tier, and activity.",
        "reports",
        "loyalty_accounts",
        _loyalty_query,
        [
            {"key": "customer_name", "label": "Client", "format": "text"},
            {"key": "points", "label": "Points", "format": "number"},
            {"key": "tier", "label": "Tier", "format": "status"},
            {"key": "total_earned", "label": "Total Earned", "format": "number"},
            {"key": "total_redeemed", "label": "Redeemed", "format": "number"},
            {"key": "created_at", "label": "Joined", "format": "datetime"},
        ],
        requires_date_range=False,
        sort_field="points",
    )

    # ─── ROTA / LABOUR REPORTS ───

    register_report(
        "rota_shifts",
        "Staff Shifts / Rota",
        "All scheduled shifts with staff, times, and hours worked.",
        "reports",
        "shifts",
        _shifts_query,
        [
            {"key": "date", "label": "Date", "format": "date"},
            {"key": "staff_name", "label": "Staff", "format": "text"},
            {"key": "start", "label": "Start", "format": "time"},
            {"key": "end", "label": "End", "format": "time"},
            {"key": "hours", "label": "Hours", "format": "number"},
            {"key": "role", "label": "Role", "format": "text"},
        ],
        sort_field="date",
    )

    # ─── CRM / PIPELINE REPORTS ───

    register_report(
        "crm_leads",
        "CRM Leads",
        "All leads in the pipeline with status, source, and contact details.",
        "reports",
        "leads",
        _leads_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "name", "label": "Name", "format": "text"},
            {"key": "email", "label": "Email", "format": "email"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "source", "label": "Source", "format": "status"},
            {"key": "score", "label": "Score", "format": "number"},
        ],
        requires_date_range=False,
        sort_field="created_at",
    )

    # ─── BLOG REPORTS ───

    register_report(
        "blog_posts",
        "Blog Posts",
        "All blog posts with status, publish date, and view count.",
        "reports",
        "blog_posts",
        _blog_query,
        [
            {"key": "title", "label": "Title", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "published_at", "label": "Published", "format": "datetime"},
            {"key": "views", "label": "Views", "format": "number"},
            {"key": "author", "label": "Author", "format": "text"},
        ],
        requires_date_range=False,
        sort_field="published_at",
    )

    # ─── NOTIFICATION REPORTS ───

    register_report(
        "notifications_log",
        "Notifications Log",
        "All system notifications with type, status, and read state.",
        "reports",
        "notifications",
        _notifications_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "title", "label": "Title", "format": "text"},
            {"key": "type", "label": "Type", "format": "status"},
            {"key": "read", "label": "Read", "format": "status"},
        ],
        sort_field="created_at",
    )

    # ─── DELIVERY REPORTS ───

    register_report(
        "delivery_orders",
        "Delivery Orders",
        "All delivery orders with status, driver, and delivery times.",
        "reports",
        "delivery_orders",
        _delivery_query,
        [
            {"key": "created_at", "label": "Ordered", "format": "datetime"},
            {"key": "order_number", "label": "Order #", "format": "text"},
            {"key": "customer_name", "label": "Customer", "format": "text"},
            {"key": "status", "label": "Status", "format": "status"},
            {"key": "total", "label": "Total", "format": "currency"},
            {"key": "delivery_fee", "label": "Delivery Fee", "format": "currency"},
            {"key": "platform", "label": "Platform", "format": "text"},
        ],
        sort_field="created_at",
    )

    # ─── ABANDONED CART REPORTS ───

    register_report(
        "abandoned_carts",
        "Abandoned Carts",
        "Bookings or orders started but not completed. Recovery opportunities.",
        "reports",
        "abandoned_carts",
        _abandoned_cart_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "customer_name", "label": "Customer", "format": "text"},
            {"key": "customer_email", "label": "Email", "format": "email"},
            {"key": "service_name", "label": "Service", "format": "text"},
            {"key": "value", "label": "Value", "format": "currency"},
            {"key": "recovered", "label": "Recovered", "format": "status"},
        ],
        sort_field="created_at",
    )

    # ─── WAITLIST REPORTS ───

    register_report(
        "waitlist",
        "Waitlist Report",
        "All waitlist entries with party size, wait time, and outcome.",
        "reports",
        "epos_waitlist",
        _waitlist_query,
        [
            {"key": "created_at", "label": "Date", "format": "datetime"},
            {"key": "customer_name", "label": "Name", "format": "text"},
            {"key": "party_size", "label": "Party", "format": "number"},
            {"key": "phone", "label": "Phone", "format": "phone"},
            {"key": "wait_time", "label": "Wait (min)", "format": "number"},
            {"key": "status", "label": "Status", "format": "status"},
        ],
        sort_field="created_at",
    )

    # ─── VIDEO MEETING REPORTS ───

    register_report(
        "video_meetings",
        "Video Meetings",
        "All video consultation sessions with duration and status.",
        "reports",
        "video_meetings",
        _video_meetings_query,
        [
            {"key": "scheduled_at", "label": "Date", "format": "datetime"},
            {"key": "client_name", "label": "Client", "format": "text"},
            {"key": "staff_name", "label": "Staff", "format": "text"},
            {"key": "duration", "label": "Duration (min)", "format": "number"},
            {"key": "status", "label": "Status", "format": "status"},
        ],
        requires_date_range=False,
        sort_field="scheduled_at",
    )


# Auto-register on import
register_all_reports()
