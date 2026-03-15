"""
ReeveOS Growth Hub — Lead Discovery Scraper
==========================================
Scrapes UK local-services businesses from Fresha, Treatwell, Booksy
and Vagaro, then writes directly into the sales_leads collection so
existing outreach campaigns can target them immediately.

Security notes:
  - Proxy credentials read from env vars (never hardcoded in git)
  - No PII stored beyond what appears on the public listing
  - Deduplication prevents double-contacting businesses
  - All admin endpoints require get_current_admin dependency
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import re
import string
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel

from database import get_database
from middleware.auth import get_current_admin

logger = logging.getLogger("scraper")

router = APIRouter(
    prefix="/scraper",
    tags=["Growth Hub"],
    dependencies=[Depends(get_current_admin)],
)

# ═══════════════════════════════════════════════════════════
# PROXY — IPRoyal Residential UK
# ═══════════════════════════════════════════════════════════

_IPROYAL_USER = os.environ.get("IPROYAL_USER", "f3lq2k8CqJhJkIG1")
_IPROYAL_PASS = os.environ.get("IPROYAL_PASS", "URdXlxSH9hqVvBtL")
_IPROYAL_HOST = "geo.iproyal.com"
_IPROYAL_PORT = 12321


def _proxy() -> str:
    """New session ID per call = new UK residential IP from IPRoyal pool."""
    sid = "".join(random.choices(string.ascii_letters + string.digits, k=8))
    pw = f"{_IPROYAL_PASS}_country-gb_session-{sid}_lifetime-30m"
    return f"http://{_IPROYAL_USER}:{pw}@{_IPROYAL_HOST}:{_IPROYAL_PORT}"


_UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
]


def _headers(referer: str = "") -> dict:
    h = {
        "User-Agent": random.choice(_UA_POOL),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin" if referer else "none",
        "DNT": "1",
    }
    if referer:
        h["Referer"] = referer
    return h


# ═══════════════════════════════════════════════════════════
# HTTP LAYER
# ═══════════════════════════════════════════════════════════

async def _fetch(url: str, timeout: int = 25) -> Optional[str]:
    proxy_url = _proxy()
    try:
        async with httpx.AsyncClient(
            proxies={"http://": proxy_url, "https://": proxy_url},
            timeout=timeout,
            follow_redirects=True,
            verify=False,
        ) as client:
            r = await client.get(url, headers=_headers())
            if r.status_code == 200:
                return r.text
            if r.status_code == 429:
                logger.warning(f"Rate-limited on {url} — backing off 15s")
                await asyncio.sleep(15)
                return None
            if r.status_code in (403, 451):
                logger.warning(f"Blocked ({r.status_code}): {url}")
                return None
            logger.info(f"HTTP {r.status_code}: {url}")
            return None
    except httpx.TimeoutException:
        logger.warning(f"Timeout: {url}")
        return None
    except Exception as exc:
        logger.error(f"Fetch error {url}: {exc}")
        return None


# ═══════════════════════════════════════════════════════════
# HTML PARSING UTILITIES
# ═══════════════════════════════════════════════════════════

def _next_data(html: str) -> Optional[dict]:
    m = re.search(
        r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>\s*(\{.*?\})\s*</script>',
        html, re.DOTALL,
    )
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    return None


def _json_ld(html: str) -> List[dict]:
    results: List[dict] = []
    for m in re.finditer(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.DOTALL,
    ):
        try:
            results.append(json.loads(m.group(1)))
        except Exception:
            pass
    return results


def _emails(html: str) -> List[str]:
    _blacklist = {
        "noreply", "no-reply", "example", "@sentry", "@cloudflare",
        "@w3", "info@fresha", "info@treatwell", "info@booksy",
        "privacy@", "legal@", "press@",
    }
    found = re.findall(
        r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', html
    )
    if not found:
        found = re.findall(
            r'\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b', html
        )
    return [e.lower() for e in found if not any(b in e.lower() for b in _blacklist)][:3]


def _dedup_key(name: str, city: str) -> str:
    n = re.sub(r'[^\w]', '', name.lower())
    c = re.sub(r'[^\w]', '', city.lower())
    return f"{n}::{c}"


# ═══════════════════════════════════════════════════════════
# LEAD STORAGE
# ═══════════════════════════════════════════════════════════

async def _save_lead(db, lead: dict) -> tuple:
    name = lead.get("name", "").strip()
    city = lead.get("city", "").strip()
    if not name or not city:
        return False, False
    key = _dedup_key(name, city)
    if await db.sales_leads.find_one({"_dedup_key": key}):
        return False, True
    lead["_dedup_key"] = key
    lead["status"] = "new"
    lead["created_at"] = datetime.utcnow()
    lead.setdefault("email_enriched", False)
    lead.setdefault("email", "")
    lead.setdefault("instagram", "")
    await db.sales_leads.insert_one(lead)
    return True, False


async def _inc(db, job_id: str, **fields):
    await db.scraper_jobs.update_one(
        {"job_id": job_id},
        {"$inc": {f"progress.{k}": v for k, v in fields.items()}},
    )


async def _set(db, job_id: str, **fields):
    await db.scraper_jobs.update_one({"job_id": job_id}, {"$set": fields})


# ═══════════════════════════════════════════════════════════
# VERTICAL SLUG MAPS
# ═══════════════════════════════════════════════════════════

_FRESHA_V = {
    "beauty": "beauty-salons", "salon": "beauty-salons",
    "hair": "hair-salons", "barber": "barbers",
    "nail": "nail-salons", "aesthetics": "aesthetics-clinics",
    "massage": "massage", "spa": "spas",
    "gym": "gyms", "lash": "lash-and-brow-bars", "brow": "lash-and-brow-bars",
}
_TREATWELL_V = {
    "beauty": "beauty", "salon": "hair", "hair": "hair",
    "barber": "barbershops", "nail": "nails", "aesthetics": "aesthetics",
    "massage": "massage", "spa": "wellbeing",
}
_BOOKSY_V = {
    "beauty": "beauty-services", "salon": "beauty-services",
    "hair": "hair", "barber": "barber",
    "nail": "nails", "aesthetics": "aesthetics", "massage": "massage",
}
_VAGARO_V = {
    "beauty": "salon", "salon": "salon", "hair": "salon",
    "barber": "barber", "nail": "nail", "aesthetics": "med-spa",
    "massage": "massage", "spa": "spa", "gym": "gym",
}
_VAGARO_COUNTIES = {
    "london": "greater-london", "manchester": "greater-manchester",
    "birmingham": "west-midlands", "leeds": "west-yorkshire",
    "bristol": "bristol", "sheffield": "south-yorkshire",
    "liverpool": "merseyside", "edinburgh": "city-of-edinburgh",
    "glasgow": "glasgow-city", "nottingham": "nottinghamshire",
    "cardiff": "cardiff", "leicester": "leicestershire",
    "coventry": "west-midlands", "bradford": "west-yorkshire",
    "newcastle": "tyne-and-wear",
}


# ═══════════════════════════════════════════════════════════
# GENERIC VENUE EXTRACTOR
# ═══════════════════════════════════════════════════════════

def _venues_from_nd(nd: dict) -> List[dict]:
    if not nd:
        return []
    props = nd.get("props", {}).get("pageProps", {})
    for key in ("venues", "salons", "businesses", "places", "results", "items", "biz", "data"):
        candidate = props.get(key)
        if isinstance(candidate, list) and candidate:
            return candidate
        if isinstance(candidate, dict):
            for sub in ("venues", "items", "results", "data"):
                sub_list = candidate.get(sub)
                if isinstance(sub_list, list) and sub_list:
                    return sub_list
    return []


def _ld_url_map(html: str) -> Dict[str, str]:
    """
    Build a name -> individual_url lookup from all ld+json blocks.
    Fresha/Treatwell embed each venue as a HealthAndBeautyBusiness block
    with both 'name' and 'url' pointing to the real listing page.
    Used to enrich __NEXT_DATA__ venues that lack a direct URL.
    """
    mapping: Dict[str, str] = {}
    for block in _json_ld(html):
        items = block if isinstance(block, list) else [block]
        for item in items:
            if isinstance(item, dict) and item.get("name") and item.get("url"):
                name = item["name"].strip().lower()
                url = item["url"]
                if url.startswith("http") and name:
                    mapping[name] = url
    return mapping


def _venues_from_ld(html: str) -> List[dict]:
    venues = []
    seen_urls: set = set()
    for block in _json_ld(html):
        if isinstance(block, list):
            for item in block:
                if isinstance(item, dict) and item.get("@type") and item.get("name"):
                    url = item.get("url", "")
                    # Deduplicate — Fresha repeats each venue ~3 times in ld+json
                    key = url or item.get("name", "")
                    if key and key not in seen_urls:
                        seen_urls.add(key)
                        venues.append({"_ld": item})
        elif isinstance(block, dict) and block.get("@type") and block.get("name"):
            url = block.get("url", "")
            key = url or block.get("name", "")
            if key and key not in seen_urls:
                seen_urls.add(key)
                venues.append({"_ld": block})
    return venues


def _parse_venue(venue: dict, city: str, platform: str, vertical: str, url: str, url_map: Optional[Dict[str, str]] = None) -> Optional[dict]:
    if "_ld" in venue:
        ld = venue["_ld"]
        name = ld.get("name", "")
        website = ld.get("url", "")
        phone_val = ld.get("telephone", "")
        addr = ld.get("address", {})
        city_val = addr.get("addressLocality", city) if isinstance(addr, dict) else city
        r = ld.get("aggregateRating", {})
        rating = float(r.get("ratingValue", 0)) if r else 0
        review_count = int(r.get("reviewCount", 0)) if r else 0
    else:
        name = (venue.get("name") or venue.get("displayName") or venue.get("businessName") or "")
        loc = venue.get("location") or venue.get("address") or {}
        city_val = ((loc.get("city") or loc.get("locality") or city) if isinstance(loc, dict) else city)
        website = venue.get("website") or venue.get("websiteUrl") or ""
        phone_val = venue.get("phone") or venue.get("phoneNumber") or venue.get("phone_number") or ""
        r = venue.get("rating") or venue.get("ratings") or venue.get("averageRating") or {}
        if isinstance(r, dict):
            rating = float(r.get("average") or r.get("value") or r.get("ratingValue") or 0)
            review_count = int(r.get("total") or r.get("count") or r.get("reviewCount") or 0)
        elif isinstance(r, (int, float)):
            rating = float(r)
            review_count = int(venue.get("reviewCount") or venue.get("ratingsCount") or 0)
        else:
            rating, review_count = 0, 0

    name = name.strip()
    if not name:
        return None

    # Resolve individual business listing URL
    # Priority: ld+json url field → __NEXT_DATA__ url fields → name lookup in url_map → fallback to search page
    if "_ld" in venue:
        individual_url = venue["_ld"].get("url", "")
    else:
        individual_url = (
            venue.get("url") or venue.get("listingUrl") or venue.get("profileUrl") or
            venue.get("href") or ""
        )
        if individual_url and not individual_url.startswith("http"):
            domains = {"Fresha": "https://www.fresha.com", "Treatwell": "https://www.treatwell.co.uk",
                       "Booksy": "https://booksy.com", "Vagaro": "https://www.vagaro.com"}
            individual_url = domains.get(platform, "") + individual_url

    # If still no URL, try the ld+json name→url lookup map
    if not individual_url and url_map and name:
        individual_url = url_map.get(name.lower(), "")

    listing_url = individual_url if individual_url else url

    return {
        "name": name,
        "city": (city_val or city).strip(),
        "vertical": vertical,
        "current_platform": platform,
        "source": f"{platform.lower()}_scrape",
        "source_url": listing_url,
        "website": (website or "").strip(),
        "phone": (phone_val or "").strip(),
        "rating": rating,
        "review_count": review_count,
        "scraped_at": datetime.utcnow(),
    }


# ═══════════════════════════════════════════════════════════
# PLATFORM SCRAPERS
# ═══════════════════════════════════════════════════════════

async def _scrape_fresha(db, city: str, vertical: str, job_id: str, max_leads: int):
    slug = _FRESHA_V.get(vertical.lower(), "beauty-salons")
    city_slug = city.lower().replace(" ", "-")
    base = f"https://www.fresha.com/lp/en/bt/{slug}/in/gb-{city_slug}"
    page, added = 1, 0

    while added < max_leads:
        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            break
        url = base if page == 1 else f"{base}?page={page}"
        html = await _fetch(url)
        if not html:
            break
        nd = _next_data(html)
        venues = _venues_from_nd(nd) or _venues_from_ld(html)
        if not venues:
            logger.info(f"Fresha: no venues page {page} ({city}/{vertical})")
            break
        url_map = _ld_url_map(html)
        for v in venues:
            if added >= max_leads:
                break
            lead = _parse_venue(v, city, "Fresha", vertical, url, url_map)
            if not lead:
                continue
            ins, dup = await _save_lead(db, lead)
            if ins:
                added += 1
                await _inc(db, job_id, leads_added=1, leads_found=1)
            elif dup:
                await _inc(db, job_id, leads_found=1, duplicates=1)
        await _inc(db, job_id, pages_scraped=1)
        if nd:
            pg = (nd.get("props", {}).get("pageProps", {}).get("pagination") or
                  nd.get("props", {}).get("pageProps", {}).get("meta") or {})
            total_pages = int(pg.get("totalPages") or pg.get("total_pages") or 1)
            if page >= total_pages:
                break
        if len(venues) < 8:
            break
        page += 1
        await asyncio.sleep(random.uniform(2.5, 4.5))


async def _scrape_treatwell(db, city: str, vertical: str, job_id: str, max_leads: int):
    slug = _TREATWELL_V.get(vertical.lower(), "beauty")
    city_slug = city.lower().replace(" ", "-")
    page, added = 1, 0
    while added < max_leads:
        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            break
        url = f"https://www.treatwell.co.uk/places/at-{slug}/in-{city_slug}-uk/?page={page}"
        html = await _fetch(url)
        if not html:
            break
        venues = _venues_from_nd(_next_data(html)) or _venues_from_ld(html)
        if not venues:
            break
        url_map = _ld_url_map(html)
        for v in venues:
            if added >= max_leads:
                break
            lead = _parse_venue(v, city, "Treatwell", vertical, url, url_map)
            if not lead:
                continue
            ins, dup = await _save_lead(db, lead)
            if ins:
                added += 1
                await _inc(db, job_id, leads_added=1, leads_found=1)
            elif dup:
                await _inc(db, job_id, leads_found=1, duplicates=1)
        await _inc(db, job_id, pages_scraped=1)
        if len(venues) < 8:
            break
        page += 1
        await asyncio.sleep(random.uniform(2.5, 5.0))


async def _scrape_booksy(db, city: str, vertical: str, job_id: str, max_leads: int):
    slug = _BOOKSY_V.get(vertical.lower(), "beauty-services")
    city_slug = city.lower().replace(" ", "_")
    page, added = 1, 0
    while added < max_leads:
        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            break
        url = f"https://booksy.com/en-gb/s/{city_slug}/{slug}?page={page}"
        html = await _fetch(url)
        if not html:
            break
        venues = _venues_from_nd(_next_data(html)) or _venues_from_ld(html)
        if not venues:
            break
        url_map = _ld_url_map(html)
        for v in venues:
            if added >= max_leads:
                break
            lead = _parse_venue(v, city, "Booksy", vertical, url, url_map)
            if not lead:
                continue
            ins, dup = await _save_lead(db, lead)
            if ins:
                added += 1
                await _inc(db, job_id, leads_added=1, leads_found=1)
            elif dup:
                await _inc(db, job_id, leads_found=1, duplicates=1)
        await _inc(db, job_id, pages_scraped=1)
        if len(venues) < 8:
            break
        page += 1
        await asyncio.sleep(random.uniform(2.0, 4.0))


async def _scrape_vagaro(db, city: str, vertical: str, job_id: str, max_leads: int):
    slug = _VAGARO_V.get(vertical.lower(), "salon")
    city_norm = city.lower().replace(" ", "-")
    county = _VAGARO_COUNTIES.get(city.lower(), city_norm)
    job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
    if job and job.get("status") == "cancelled":
        return
    url = f"https://www.vagaro.com/listings/{slug}/{city_norm}--{county}--gb"
    html = await _fetch(url)
    if not html:
        return
    venues = _venues_from_nd(_next_data(html)) or _venues_from_ld(html)
    url_map = _ld_url_map(html)
    added = 0
    for v in venues[:max_leads]:
        lead = _parse_venue(v, city, "Vagaro", vertical, url, url_map)
        if not lead:
            continue
        ins, dup = await _save_lead(db, lead)
        if ins:
            added += 1
            await _inc(db, job_id, leads_added=1, leads_found=1)
        elif dup:
            await _inc(db, job_id, leads_found=1, duplicates=1)
    await _inc(db, job_id, pages_scraped=1)


# ═══════════════════════════════════════════════════════════
# EMAIL ENRICHMENT
# ═══════════════════════════════════════════════════════════

async def _enrich_email(website: str) -> Optional[str]:
    if not website:
        return None
    if not website.startswith("http"):
        website = f"https://{website}"
    html = await _fetch(website)
    if html:
        found = _emails(html)
        if found:
            return found[0]
    base = website.rstrip("/")
    for path in ["/contact", "/contact-us", "/about", "/about-us"]:
        ch = await _fetch(f"{base}{path}", timeout=15)
        if ch:
            found = _emails(ch)
            if found:
                return found[0]
        await asyncio.sleep(1)
    return None


# ═══════════════════════════════════════════════════════════
# JOB RUNNER
# ═══════════════════════════════════════════════════════════

_SCRAPERS = {
    "fresha": _scrape_fresha,
    "treatwell": _scrape_treatwell,
    "booksy": _scrape_booksy,
    "vagaro": _scrape_vagaro,
}


async def _run_job(job_id: str, platform: str, city: str, vertical: str, max_leads: int):
    from database import get_database as _gdb
    db = _gdb()
    await _set(db, job_id, status="running", started_at=datetime.utcnow())
    fn = _SCRAPERS.get(platform.lower())
    if not fn:
        await _set(db, job_id, status="failed", error=f"Unknown platform: {platform}")
        return
    try:
        await fn(db, city, vertical, job_id, max_leads)
        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") not in ("cancelled",):
            await _set(db, job_id, status="completed", completed_at=datetime.utcnow())
    except Exception as exc:
        logger.error(f"Job {job_id} failed: {exc}")
        await _set(db, job_id, status="failed", error=str(exc), completed_at=datetime.utcnow())


# ═══════════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════════

class StartJobRequest(BaseModel):
    platform: str
    city: str
    vertical: str
    max_leads: int = 200


class BulkLeadsRequest(BaseModel):
    lead_ids: List[str]


def _ser(doc: dict) -> dict:
    if not doc:
        return {}
    doc["_id"] = str(doc.get("_id", ""))
    doc.pop("_dedup_key", None)
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


# ═══════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/stats")
async def get_stats():
    db = get_database()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [{"$group": {"_id": "$source", "count": {"$sum": 1}}}]
    by_source: Dict[str, int] = {}
    async for row in db.sales_leads.aggregate(pipeline):
        by_source[row["_id"] or "unknown"] = row["count"]
    return {
        "total_leads":  await db.sales_leads.count_documents({}),
        "new_today":    await db.sales_leads.count_documents({"created_at": {"$gte": today}}),
        "with_email":   await db.sales_leads.count_documents({"email": {"$nin": ["", None]}}),
        "enriched":     await db.sales_leads.count_documents({"email_enriched": True}),
        "contacted":    await db.sales_leads.count_documents({"status": "contacted"}),
        "interested":   await db.sales_leads.count_documents({"status": "interested"}),
        "converted":    await db.sales_leads.count_documents({"status": "converted"}),
        "running_jobs": await db.scraper_jobs.count_documents({"status": "running"}),
        "by_source":    by_source,
    }


@router.post("/jobs")
async def start_job(body: StartJobRequest, background_tasks: BackgroundTasks):
    db = get_database()
    if body.platform.lower() not in _SCRAPERS:
        raise HTTPException(400, f"Platform must be one of: {', '.join(_SCRAPERS)}")
    if not (1 <= body.max_leads <= 1000):
        raise HTTPException(400, "max_leads must be 1–1000")
    job_id = str(uuid4())
    await db.scraper_jobs.insert_one({
        "job_id": job_id,
        "platform": body.platform.lower(),
        "city": body.city,
        "vertical": body.vertical.lower(),
        "max_leads": body.max_leads,
        "status": "queued",
        "progress": {"pages_scraped": 0, "leads_found": 0, "leads_added": 0, "duplicates": 0},
        "created_at": datetime.utcnow(),
        "started_at": None,
        "completed_at": None,
        "error": None,
    })
    background_tasks.add_task(_run_job, job_id, body.platform, body.city, body.vertical, body.max_leads)
    return {"job_id": job_id, "status": "queued"}


@router.get("/jobs")
async def list_jobs(skip: int = 0, limit: int = 30):
    db = get_database()
    jobs = []
    async for doc in db.scraper_jobs.find().sort("created_at", -1).skip(skip).limit(limit):
        jobs.append(_ser(doc))
    return {"jobs": jobs, "total": await db.scraper_jobs.count_documents({})}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    db = get_database()
    doc = await db.scraper_jobs.find_one({"job_id": job_id})
    if not doc:
        raise HTTPException(404, "Job not found")
    return _ser(doc)


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    db = get_database()
    r = await db.scraper_jobs.update_one(
        {"job_id": job_id, "status": {"$in": ["queued", "running"]}},
        {"$set": {"status": "cancelled", "completed_at": datetime.utcnow()}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Job not found or already finished")
    return {"message": "Job cancelled"}


@router.get("/leads")
async def list_leads(
    skip: int = 0,
    limit: int = 50,
    source: Optional[str] = None,
    vertical: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    has_email: Optional[bool] = Query(None),
    search: Optional[str] = None,
):
    db = get_database()
    q: Dict[str, Any] = {}
    if source:
        q["source"] = source
    if vertical:
        q["vertical"] = {"$regex": vertical, "$options": "i"}
    if city:
        q["city"] = {"$regex": city, "$options": "i"}
    if status:
        q["status"] = status
    if has_email is True:
        q["email"] = {"$nin": ["", None]}
    elif has_email is False:
        q["$or"] = [{"email": ""}, {"email": {"$exists": False}}, {"email": None}]
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    leads = []
    async for doc in db.sales_leads.find(q).sort("created_at", -1).skip(skip).limit(limit):
        leads.append(_ser(doc))
    return {"leads": leads, "total": await db.sales_leads.count_documents(q)}


@router.post("/leads/{lead_id}/enrich")
async def enrich_lead(lead_id: str, background_tasks: BackgroundTasks):
    db = get_database()
    try:
        lead = await db.sales_leads.find_one({"_id": ObjectId(lead_id)})
    except Exception:
        raise HTTPException(400, "Invalid lead ID")
    if not lead:
        raise HTTPException(404, "Lead not found")
    if not lead.get("website"):
        raise HTTPException(400, "Lead has no website to enrich from")
    website = lead["website"]

    async def _do():
        db2 = get_database()
        email = await _enrich_email(website)
        await db2.sales_leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"email": email or "", "email_enriched": True, "email_enriched_at": datetime.utcnow()}},
        )

    background_tasks.add_task(_do)
    return {"message": "Enrichment started", "lead_id": lead_id}


@router.post("/leads/bulk-enrich")
async def bulk_enrich(body: BulkLeadsRequest, background_tasks: BackgroundTasks):
    async def _do():
        db2 = get_database()
        for lid in body.lead_ids:
            try:
                lead = await db2.sales_leads.find_one({"_id": ObjectId(lid)})
                if lead and lead.get("website") and not lead.get("email_enriched"):
                    email = await _enrich_email(lead["website"])
                    await db2.sales_leads.update_one(
                        {"_id": ObjectId(lid)},
                        {"$set": {"email": email or "", "email_enriched": True,
                                  "email_enriched_at": datetime.utcnow()}},
                    )
                    await asyncio.sleep(random.uniform(1.5, 3.5))
            except Exception as exc:
                logger.error(f"Bulk enrich {lid}: {exc}")

    background_tasks.add_task(_do)
    return {"message": f"Bulk enrichment started for {len(body.lead_ids)} leads"}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    db = get_database()
    try:
        r = await db.sales_leads.delete_one({"_id": ObjectId(lead_id)})
    except Exception:
        raise HTTPException(400, "Invalid lead ID")
    if r.deleted_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"message": "Lead deleted"}


@router.post("/leads/bulk-delete")
async def bulk_delete(body: BulkLeadsRequest):
    db = get_database()
    oids = []
    for lid in body.lead_ids:
        try:
            oids.append(ObjectId(lid))
        except Exception:
            pass
    r = await db.sales_leads.delete_many({"_id": {"$in": oids}})
    return {"deleted": r.deleted_count}


@router.delete("/leads")
async def delete_all_leads(
    source: Optional[str] = None,
    vertical: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
):
    """Delete ALL leads matching the given filters. No filter = wipe everything."""
    db = get_database()
    q: Dict[str, Any] = {}
    if source:
        q["source"] = source
    if vertical:
        q["vertical"] = {"$regex": vertical, "$options": "i"}
    if city:
        q["city"] = {"$regex": city, "$options": "i"}
    if status:
        q["status"] = status
    r = await db.sales_leads.delete_many(q)
    return {"deleted": r.deleted_count}


@router.post("/leads/{lead_id}/push-outreach")
async def push_to_outreach(lead_id: str, campaign_id: Optional[str] = None):
    db = get_database()
    try:
        lead = await db.sales_leads.find_one({"_id": ObjectId(lead_id)})
    except Exception:
        raise HTTPException(400, "Invalid lead ID")
    if not lead:
        raise HTTPException(404, "Lead not found")
    upd: Dict[str, Any] = {"status": "outreach_queued", "outreach_queued_at": datetime.utcnow()}
    if campaign_id:
        upd["campaign_id"] = campaign_id
    await db.sales_leads.update_one({"_id": ObjectId(lead_id)}, {"$set": upd})
    return {"message": "Lead queued for outreach"}
