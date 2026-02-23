from fastapi import APIRouter, HTTPException, status, Depends, Query
from database import get_database
from middleware.auth import get_current_owner
from datetime import datetime, date, timedelta
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/business/{business_id}/overview")
async def get_analytics_overview(
    business_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    # Use bookings collection (Run 2) — aligned with dashboard, calendar, staff
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()
    total_bookings = await db.bookings.count_documents({
        "businessId": business_id,
        "date": {"$gte": start_str, "$lte": end_str}
    })

    confirmed_bookings = await db.bookings.count_documents({
        "businessId": business_id,
        "date": {"$gte": start_str, "$lte": end_str},
        "status": {"$in": ["confirmed", "completed", "checked_in"]}
    })

    cancelled_bookings = await db.bookings.count_documents({
        "businessId": business_id,
        "date": {"$gte": start_str, "$lte": end_str},
        "status": "cancelled"
    })

    no_shows = await db.bookings.count_documents({
        "businessId": business_id,
        "date": {"$gte": start_str, "$lte": end_str},
        "status": "no_show"
    })
    
    total_reviews = await db.reviews.count_documents({
        "business_id": business_id,
        "created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}
    })
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "bookings": {
            "total": total_bookings,
            "confirmed": confirmed_bookings,
            "cancelled": cancelled_bookings,
            "no_shows": no_shows,
            "cancellation_rate": round((cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0, 2),
            "no_show_rate": round((no_shows / total_bookings * 100) if total_bookings > 0 else 0, 2)
        },
        "reviews": {
            "total": total_reviews,
            "average_rating": business.get("rating", 0)
        }
    }


@router.get("/business/{business_id}/bookings-by-day")
async def get_bookings_by_day(
    business_id: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()
    pipeline = [
        {
            "$match": {
                "businessId": business_id,
                "date": {"$gte": start_str, "$lte": end_str}
            }
        },
        {
            "$group": {
                "_id": "$date",
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id": 1}
        }
    ]

    results = await db.bookings.aggregate(pipeline).to_list(length=None)
    
    return results


@router.get("/business/{business_id}/revenue")
async def get_revenue_analytics(
    business_id: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()
    pipeline = [
        {"$match": {"businessId": business_id, "date": {"$gte": start_str, "$lte": end_str}, "status": {"$in": ["confirmed", "completed", "checked_in"]}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": {"$ifNull": ["$service.price", 0]}}, "count": {"$sum": 1}}}
    ]
    results = await db.bookings.aggregate(pipeline).to_list(length=None)

    if results and results[0].get("count", 0) > 0:
        tot = results[0].get("total_revenue", 0) or 0
        cnt = results[0].get("count", 0)
        return {
            "total_revenue": tot,
            "total_transactions": cnt,
            "average_transaction": round(tot / cnt, 2) if cnt else 0
        }

    return {"total_revenue": 0, "total_transactions": 0, "average_transaction": 0}


@router.get("/business/{business_id}/popular-times")
async def get_popular_times(
    business_id: str,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    start_str = (date.today() - timedelta(days=90)).isoformat()
    # time is string "HH:MM" — extract hour via $substr
    pipeline = [
        {"$match": {"businessId": business_id, "date": {"$gte": start_str}, "status": {"$in": ["confirmed", "completed", "checked_in"]}}},
        {"$addFields": {"hour": {"$toInt": {"$substr": [{"$ifNull": ["$time", "00:00"]}, 0, 2]}}}},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    results = await db.bookings.aggregate(pipeline).to_list(length=None)
    return results
