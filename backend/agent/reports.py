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


# Auto-register on import
register_all_reports()
