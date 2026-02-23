from fastapi import APIRouter, HTTPException, status, Depends, Request
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import stripe
from config import settings

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/payments", tags=["payments"])


class StripeConnectResponse(BaseModel):
    url: str


@router.post("/stripe/connect", response_model=StripeConnectResponse)
async def create_stripe_connect_account(
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
    
    try:
        account = stripe.Account.create(
            type="standard",
            country="GB",
            email=current_user["email"],
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            }
        )
        
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{settings.frontend_url}/dashboard/settings/payments",
            return_url=f"{settings.frontend_url}/dashboard/settings/payments?success=true",
            type="account_onboarding",
        )
        
        await db.businesses.update_one(
            {"_id": business_id},
            {
                "$set": {
                    "stripe_account_id": account.id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"stripe_connected": True}}
        )
        
        return StripeConnectResponse(url=account_link.url)
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stripe/account/{business_id}")
async def get_stripe_account_status(
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
    
    stripe_account_id = business.get("stripe_account_id")
    if not stripe_account_id:
        return {"connected": False}
    
    try:
        account = stripe.Account.retrieve(stripe_account_id)
        
        return {
            "connected": True,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "details_submitted": account.details_submitted
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    return {"status": "success"}


@router.post("/create-payment-intent")
async def create_payment_intent(
    amount: float,
    business_id: str,
    reservation_id: str,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    stripe_account_id = business.get("stripe_account_id")
    if not stripe_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business has not connected Stripe"
        )
    
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency="gbp",
            application_fee_amount=int(amount * 100 * 0.02),
            transfer_data={
                "destination": stripe_account_id,
            },
            metadata={
                "business_id": business_id,
                "reservation_id": reservation_id
            }
        )
        
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
