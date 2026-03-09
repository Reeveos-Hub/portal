"""
Admin Partners — Proxy to partners.reeveos.app backend.
Keeps internal API key server-side. Never exposed to browser.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_admin
import os

router = APIRouter(prefix="/admin/partners", tags=["admin-partners"], dependencies=[Depends(get_current_admin)])

PARTNERS_URL = "https://partners.reeveos.app/api/admin"
INTERNAL_KEY = os.getenv("PARTNERS_INTERNAL_KEY", "")


def _headers():
    return {"X-Internal-Key": INTERNAL_KEY, "Content-Type": "application/json"}


async def _proxy_get(path: str, params: dict = None):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{PARTNERS_URL}{path}", headers=_headers(), params=params)
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


async def _proxy_put(path: str, body: dict = None):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.put(f"{PARTNERS_URL}{path}", headers=_headers(), json=body or {})
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


@router.get("/overview")
async def partners_overview():
    return await _proxy_get("/overview")


@router.get("/affiliates")
async def list_affiliates(
    status: str = Query("pending"),
    page: int = Query(1),
    limit: int = Query(25),
    search: str = Query("")
):
    return await _proxy_get("/affiliates", {"status": status, "page": page, "limit": limit, "search": search})


@router.put("/affiliates/{affiliate_id}/approve")
async def approve_affiliate(affiliate_id: str):
    return await _proxy_put(f"/affiliates/{affiliate_id}/approve")


@router.put("/affiliates/{affiliate_id}/reject")
async def reject_affiliate(affiliate_id: str):
    return await _proxy_put(f"/affiliates/{affiliate_id}/reject")


@router.put("/affiliates/{affiliate_id}/suspend")
async def suspend_affiliate(affiliate_id: str):
    return await _proxy_put(f"/affiliates/{affiliate_id}/suspend")


@router.get("/commissions")
async def list_commissions(
    status: str = Query("pending"),
    page: int = Query(1)
):
    return await _proxy_get("/commissions", {"status": status, "page": page})
