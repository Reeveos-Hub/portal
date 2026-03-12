"""
Dashboard Layout API — save/load per-user widget layouts
Stores layout in user_dashboard_layouts collection, keyed by user_id
"""

from fastapi import APIRouter, HTTPException, Depends
from database import get_database
from middleware.auth import get_current_staff
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# Default layout for salon/services businesses
DEFAULT_LAYOUT_SERVICES = [
    {"i": "stats", "x": 0, "y": 0, "w": 4, "h": 2},
    {"i": "upcoming", "x": 0, "y": 2, "w": 2, "h": 5},
    {"i": "trends", "x": 2, "y": 2, "w": 2, "h": 3},
    {"i": "quickActions", "x": 2, "y": 5, "w": 1, "h": 3},
    {"i": "activity", "x": 3, "y": 5, "w": 1, "h": 3},
    {"i": "weekGlance", "x": 0, "y": 7, "w": 2, "h": 3},
    {"i": "services", "x": 2, "y": 8, "w": 2, "h": 3},
    {"i": "consultations", "x": 0, "y": 10, "w": 2, "h": 2},
]

# Default layout for restaurant businesses
DEFAULT_LAYOUT_RESTAURANT = [
    {"i": "stats", "x": 0, "y": 0, "w": 4, "h": 2},
    {"i": "trends", "x": 0, "y": 2, "w": 2, "h": 3},
    {"i": "quickActions", "x": 2, "y": 2, "w": 1, "h": 3},
    {"i": "activity", "x": 3, "y": 2, "w": 1, "h": 3},
    {"i": "floorStatus", "x": 0, "y": 5, "w": 2, "h": 3},
    {"i": "upcoming", "x": 2, "y": 5, "w": 2, "h": 5},
    {"i": "weekGlance", "x": 0, "y": 8, "w": 2, "h": 3},
    {"i": "services", "x": 0, "y": 11, "w": 2, "h": 3},
]

# Required widgets that cannot be removed
REQUIRED_WIDGETS = {"stats", "upcoming"}


@router.get("/layout")
async def get_dashboard_layout(
    user: dict = Depends(get_current_staff),
    db=Depends(get_database),
):
    """Get the current user's saved dashboard layout, or return default."""
    uid = str(user.get("_id", ""))
    if not uid:
        raise HTTPException(401, "Not authenticated")

    saved = await db.user_dashboard_layouts.find_one({"user_id": uid})

    if saved:
        return {
            "layout": saved.get("layout", []),
            "hidden_widgets": saved.get("hidden_widgets", []),
            "locked_widgets": saved.get("locked_widgets", []),
            "is_default": False,
            "updated_at": saved.get("updated_at"),
        }

    # Return default based on business type
    business_type = user.get("business_type", "services")
    default = (
        DEFAULT_LAYOUT_RESTAURANT
        if business_type == "restaurant"
        else DEFAULT_LAYOUT_SERVICES
    )
    return {
        "layout": default,
        "hidden_widgets": [],
        "locked_widgets": [],
        "is_default": True,
        "updated_at": None,
    }


@router.put("/layout")
async def save_dashboard_layout(
    payload: dict,
    user: dict = Depends(get_current_staff),
    db=Depends(get_database),
):
    """Save the current user's dashboard layout."""
    uid = str(user.get("_id", ""))
    if not uid:
        raise HTTPException(401, "Not authenticated")

    layout = payload.get("layout")
    if not layout or not isinstance(layout, list):
        raise HTTPException(400, "layout must be a non-empty list")

    # Validate: required widgets must be present
    widget_ids = {item.get("i") for item in layout}
    hidden = set(payload.get("hidden_widgets", []))
    for req in REQUIRED_WIDGETS:
        if req not in widget_ids and req not in hidden:
            raise HTTPException(400, f"Required widget '{req}' cannot be removed")

    # Validate: each layout item has required fields
    for item in layout:
        if not all(k in item for k in ("i", "x", "y", "w", "h")):
            raise HTTPException(400, f"Layout item missing required fields: {item}")
        # Sanitise to integers
        for k in ("x", "y", "w", "h"):
            if not isinstance(item[k], (int, float)):
                raise HTTPException(400, f"Layout field '{k}' must be numeric")
            item[k] = int(item[k])

    doc = {
        "user_id": uid,
        "layout": layout,
        "hidden_widgets": list(hidden),
        "locked_widgets": payload.get("locked_widgets", []),
        "updated_at": datetime.utcnow(),
    }

    await db.user_dashboard_layouts.update_one(
        {"user_id": uid},
        {"$set": doc},
        upsert=True,
    )

    return {"ok": True, "message": "Layout saved"}


@router.delete("/layout")
async def reset_dashboard_layout(
    user: dict = Depends(get_current_staff),
    db=Depends(get_database),
):
    """Reset the current user's layout back to default."""
    uid = str(user.get("_id", ""))
    if not uid:
        raise HTTPException(401, "Not authenticated")

    await db.user_dashboard_layouts.delete_one({"user_id": uid})
    return {"ok": True, "message": "Layout reset to default"}
