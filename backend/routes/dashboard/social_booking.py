"""
Social Booking API — embeddable booking widget for websites, Facebook, Instagram.
Generates embed codes and handles Reserve with Google integration.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse
from database import get_database
from middleware.tenant import verify_business_access, TenantContext

router = APIRouter(prefix="/social-booking", tags=["social-booking"])


@router.get("/business/{business_id}/embed-code")
async def get_embed_code(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    """Generate embed codes for website, Facebook, Instagram."""
    db = get_database()
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        from bson import ObjectId
        try:
            business = await db.businesses.find_one({"_id": ObjectId(business_id)})
        except:
            pass
    if not business:
        raise HTTPException(404, "Business not found")

    slug = business.get("slug") or business.get("booking_slug") or business_id
    booking_url = f"https://portal.rezvo.app/book/{slug}"
    biz_name = business.get("name", "Book Now")

    # Website embed button
    website_html = f'''<a href="{booking_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#111111;color:#fff;border-radius:8px;font-family:sans-serif;font-weight:600;font-size:14px;text-decoration:none">Book with {biz_name}</a>'''

    # Website embed iframe
    website_iframe = f'''<iframe src="{booking_url}?embed=true" width="100%" height="700" frameborder="0" style="border-radius:12px;border:1px solid #eee"></iframe>'''

    # Facebook action URL
    facebook_url = booking_url

    # Instagram link-in-bio
    instagram_url = booking_url

    # QR code URL (frontend can render this with a QR library)
    qr_data = booking_url

    # Reserve with Google data
    rwg = {
        "place_action_link": booking_url,
        "provider": "ReeveOS",
    }

    return {
        "booking_url": booking_url,
        "website_button": website_html,
        "website_iframe": website_iframe,
        "facebook_url": facebook_url,
        "instagram_url": instagram_url,
        "qr_data": qr_data,
        "reserve_with_google": rwg,
    }


@router.get("/widget/{slug}")
async def booking_widget_page(slug: str):
    """Embeddable booking widget as standalone HTML page."""
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book Now</title>
<style>body{{margin:0;font-family:sans-serif}}iframe{{width:100%;height:100vh;border:none}}</style>
</head><body>
<iframe src="https://portal.rezvo.app/book/{slug}?embed=true"></iframe>
</body></html>""")
