from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from middleware.auth import get_current_owner

router = APIRouter(prefix="/reputation", tags=["reputation"])


@router.get("/business/{business_id}/review-stats")
async def get_review_stats(
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
    
    pipeline = [
        {
            "$match": {"business_id": business_id}
        },
        {
            "$group": {
                "_id": "$rating",
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id": -1}
        }
    ]
    
    rating_distribution = await db.reviews.aggregate(pipeline).to_list(length=None)
    
    total_reviews = sum(item["count"] for item in rating_distribution)
    
    distribution = {str(i): 0 for i in range(1, 6)}
    for item in rating_distribution:
        distribution[str(item["_id"])] = item["count"]
    
    return {
        "total_reviews": total_reviews,
        "average_rating": business.get("rating", 0),
        "rating_distribution": distribution
    }


@router.get("/business/{business_id}/sentiment")
async def get_sentiment_analysis(
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
    
    reviews = await db.reviews.find({"business_id": business_id}).to_list(length=None)
    
    positive = sum(1 for r in reviews if r["rating"] >= 4)
    neutral = sum(1 for r in reviews if r["rating"] == 3)
    negative = sum(1 for r in reviews if r["rating"] <= 2)
    
    return {
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "total": len(reviews)
    }


@router.post("/business/{business_id}/google-review-booster")
async def trigger_google_review_booster(
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
    
    if business.get("rezvo_tier") != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Review Booster is only available for Premium tier"
        )
    
    return {"detail": "Google Review Booster campaign initiated"}
