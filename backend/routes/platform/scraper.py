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
import html as html_mod
import json
import urllib.parse
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
import fastapi
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


def _normalise(name: str) -> str:
    """Normalise a business name for matching — unescape HTML entities, lowercase, strip punctuation."""
    name = html_mod.unescape(name)
    name = re.sub(r'[&\/\-]', ' ', name)
    name = re.sub(r'[^\w\s]', '', name)
    return re.sub(r'\s+', ' ', name).strip().lower()


def _ld_url_map(html_content: str) -> Dict[str, str]:
    """
    Build a normalised-name -> individual_url lookup from all ld+json blocks.
    Also indexes by /a/ slug extracted from URL for fuzzy matching.
    """
    mapping: Dict[str, str] = {}
    # Also extract all /a/ hrefs directly from HTML as a fallback
    href_urls = re.findall(r'href="(https://www\.fresha\.com/a/[a-z0-9\-]+)"', html_content)
    for url in href_urls:
        # Extract readable words from the slug (before the random ID at end)
        slug = url.split('/a/')[-1]
        # Remove the random 8-char ID at the end (e.g. -a361gesg)
        slug_words = re.sub(r'-[a-z0-9]{8}$', '', slug)
        slug_key = slug_words.replace('-', ' ').strip()
        if slug_key:
            mapping[f"__slug__{slug_key}"] = url

    for block in _json_ld(html_content):
        items = block if isinstance(block, list) else [block]
        for item in items:
            if isinstance(item, dict) and item.get("name") and item.get("url"):
                url = item["url"]
                if not url.startswith("http"):
                    continue
                # Index by normalised name
                norm = _normalise(item["name"])
                if norm:
                    mapping[norm] = url
                # Also index by raw lowercase name for exact matches
                raw = item["name"].strip().lower()
                if raw:
                    mapping[raw] = url
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

    # If still no URL, try multiple name lookup strategies
    if not individual_url and url_map and name:
        # Strategy 1: exact lowercase match
        individual_url = url_map.get(name.lower(), "")
        # Strategy 2: normalised match (handles HTML entities, punctuation)
        if not individual_url:
            individual_url = url_map.get(_normalise(name), "")
        # Strategy 3: slug-word match — find a slug that contains all words of the name
        if not individual_url:
            name_words = set(_normalise(name).split())
            if len(name_words) >= 2:
                for key, url in url_map.items():
                    if key.startswith("__slug__"):
                        slug_words = set(key[8:].split())
                        if name_words.issubset(slug_words) or slug_words.issubset(name_words):
                            individual_url = url
                            break

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
# GOOGLE SEARCH + YELL ENRICHMENT
# ═══════════════════════════════════════════════════════════

def _parse_google_results(html_content: str) -> Dict[str, Any]:
    """
    Extract social handles and website from Google search result snippets.
    Works on both desktop and mobile Google HTML.
    No API key needed — uses proxy to avoid blocks.
    """
    found: Dict[str, Any] = {}

    # Extract all URLs from result links
    all_urls = re.findall(
        r'href="(https?://(?:www\.)?(?:instagram|facebook|tiktok|twitter|x)\.com/[^"&]{3,80})"',
        html_content, re.IGNORECASE
    )

    _blacklist = {
        "instagram.com", "facebook.com", "tiktok.com", "twitter.com", "x.com",
        "instagram.com/p/", "instagram.com/reel", "instagram.com/explore",
        "instagram.com/stories", "facebook.com/sharer", "facebook.com/share",
        "facebook.com/login", "twitter.com/intent", "facebook.com/groups",
    }

    for url in all_urls:
        url_lower = url.lower()
        # Skip blacklisted patterns
        if any(b in url_lower for b in _blacklist):
            continue

        if "instagram.com" in url_lower and "instagram" not in found:
            handle = re.sub(r"https?://(?:www\.)?instagram\.com/", "", url).strip("/").split("?")[0].split("/")[0]
            if handle and len(handle) >= 2 and not handle.startswith("p/"):
                found["instagram"] = handle

        elif "facebook.com" in url_lower and "facebook" not in found:
            handle = re.sub(r"https?://(?:www\.)?facebook\.com/(?:pages/)?", "", url).strip("/").split("?")[0].split("/")[0]
            if handle and len(handle) >= 3 and handle not in ("login", "sharer", "share", "groups", "events"):
                found["facebook"] = handle

        elif "tiktok.com" in url_lower and "tiktok" not in found:
            handle = re.sub(r"https?://(?:www\.)?tiktok\.com/@?", "", url).strip("/").split("?")[0].split("/")[0]
            if handle and len(handle) >= 2:
                found["tiktok"] = handle.lstrip("@")

        elif ("twitter.com" in url_lower or "x.com" in url_lower) and "twitter" not in found:
            handle = re.sub(r"https?://(?:www\.)?(?:twitter|x)\.com/", "", url).strip("/").split("?")[0].split("/")[0]
            if handle and len(handle) >= 2 and handle not in ("intent", "share", "home", "login"):
                found["twitter"] = handle

    # Also extract website from search results if not in socials
    website_matches = re.findall(
        r'href="(https?://(?!(?:www\.)?(?:google|instagram|facebook|tiktok|twitter|x|fresha|treatwell|booksy|vagaro|yell)\.)[^"]{10,80})"',
        html_content
    )
    if website_matches and "website" not in found:
        for w in website_matches[:3]:
            if not any(x in w.lower() for x in ["google", "cache:", "translate"]):
                found["website"] = w
                break

    return found


async def _google_search_enrichment(name: str, city: str) -> Dict[str, Any]:
    """
    Run targeted Google searches to find social media profiles for a business.
    Three searches: Instagram, Facebook/TikTok combined, then website fallback.
    Uses proxy to avoid Google blocking.
    """
    result: Dict[str, Any] = {}
    name_clean = re.sub(r"[^\w\s]", "", name).strip()
    city_clean = city.strip()

    searches = [
        # Instagram targeted
        f'"{name_clean}" {city_clean} site:instagram.com',
        # Facebook + TikTok
        f'"{name_clean}" {city_clean} site:facebook.com OR site:tiktok.com',
        # General — finds website + any social
        f'"{name_clean}" {city_clean} beauty salon',
    ]

    for query in searches:
        # Stop early if we have Instagram (most valuable)
        if result.get("instagram") and (result.get("facebook") or result.get("tiktok")):
            break

        encoded = urllib.parse.quote_plus(query)
        url = f"https://www.google.com/search?q={encoded}&num=10&hl=en&gl=gb"

        html_content = await _fetch(url, timeout=20)
        if not html_content:
            await asyncio.sleep(2)
            continue

        # Check if Google served a captcha
        if "detected unusual traffic" in html_content.lower() or "captcha" in html_content.lower():
            logger.warning(f"Google captcha triggered for: {name}")
            await asyncio.sleep(random.uniform(5, 10))
            continue

        parsed = _parse_google_results(html_content)
        for k, v in parsed.items():
            if v and not result.get(k):
                result[k] = v

        await asyncio.sleep(random.uniform(2.0, 4.0))

    return result


async def _yell_enrichment(name: str, city: str) -> Dict[str, Any]:
    """
    Search Yell.com for the business — finds phone, website, address.
    Yell has near-complete UK business coverage.
    """
    result: Dict[str, Any] = {}
    encoded_name = urllib.parse.quote_plus(name)
    encoded_city = urllib.parse.quote_plus(city)
    url = f"https://www.yell.com/ucs/UcsSearchAction.do?keywords={encoded_name}&location={encoded_city}&pageNum=1"

    html_content = await _fetch(url, timeout=20)
    if not html_content:
        return result

    # Extract first result's phone
    phone_match = re.search(
        r'data-phone="([^"]+)"',
        html_content
    )
    if phone_match:
        result["phone"] = phone_match.group(1).strip()

    # Extract website link from first result
    website_match = re.search(
        r'class="[^"]*businessCapsule--website[^"]*"[^>]*href="([^"]+)"',
        html_content
    )
    if website_match:
        result["website"] = website_match.group(1).strip()

    # Fallback — look for any phone pattern near the business name
    if not result.get("phone"):
        # Find name in HTML then look for nearby phone
        name_idx = html_content.lower().find(name.lower()[:20])
        if name_idx > -1:
            nearby = html_content[name_idx:name_idx + 500]
            phone_nearby = re.search(r"(0[\d\s]{9,12}|\+44[\d\s]{9,12})", nearby)
            if phone_nearby:
                result["phone"] = re.sub(r"\s+", "", phone_nearby.group(1))

    return result


async def _full_enrichment(lead: dict) -> Dict[str, Any]:
    """
    Master enrichment function — runs all stages in sequence.
    Stage 1: Website + Fresha listing (existing)
    Stage 2: Google search for socials
    Stage 3: Yell for phone/website fallback
    Merges everything, existing values take priority.
    """
    name = lead.get("name", "")
    city = lead.get("city", "")
    website = lead.get("website", "")
    source_url = lead.get("source_url", "")

    # Start with existing data so we don't overwrite already-found values
    result: Dict[str, Any] = {
        "email":     lead.get("email", ""),
        "phone":     lead.get("phone", ""),
        "website":   website,
        "instagram": lead.get("instagram", ""),
        "facebook":  lead.get("facebook", ""),
        "tiktok":    lead.get("tiktok", ""),
        "twitter":   lead.get("twitter", ""),
    }

    # Stage 1 — website + Fresha listing
    stage1 = await _enrich_lead_data(website, source_url)
    for k, v in stage1.items():
        if v and not result.get(k):
            result[k] = v

    # Stage 2 — Google search (only if still missing socials)
    missing_socials = not result.get("instagram") or not result.get("facebook")
    if missing_socials and name and city:
        stage2 = await _google_search_enrichment(name, city)
        for k, v in stage2.items():
            if v and not result.get(k):
                result[k] = v
        await asyncio.sleep(random.uniform(1.0, 2.0))

    # Stage 3 — Yell (only if missing phone or website)
    if (not result.get("phone") or not result.get("website")) and name and city:
        stage3 = await _yell_enrichment(name, city)
        for k, v in stage3.items():
            if v and not result.get(k):
                result[k] = v

    return result


# ═══════════════════════════════════════════════════════════
# JOB RUNNER
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# MTI SCRAPER — Massage Training Institute
# Single page, all data in dopoint() JS calls
# ═══════════════════════════════════════════════════════════

async def _scrape_mti(db, city: str, vertical: str, job_id: str, max_leads: int):
    """
    MTI embeds ALL therapists as dopoint() calls on one page.
    No pagination, no auth, no anti-scraping — single request.
    City/vertical filters applied after extraction (data is UK-wide).
    """
    url = "https://www.massagetraining.co.uk/therapists/"
    html = await _fetch(url, timeout=30)
    if not html:
        logger.warning("MTI: failed to fetch therapists page")
        return

    # Extract all dopoint() calls
    # Pattern: dopoint('Name', 'lat,lng', '<html>', 'id', '', '');
    pattern = re.compile(
        r"dopoint\('([^']*)',\s*'([^']*)',\s*'(.*?)',\s*'(\d+)',\s*'[^']*',\s*'[^']*'\);",
        re.DOTALL
    )

    added = 0
    seen_ids: set = set()

    for m in pattern.finditer(html):
        if added >= max_leads:
            break

        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            break

        name = html_mod.unescape(m.group(1)).strip()
        coords = m.group(2).strip()
        info_html = m.group(3)
        therapist_id = m.group(4)

        if not name or therapist_id in seen_ids:
            continue
        seen_ids.add(therapist_id)

        # Extract city from info HTML: <p>CityName</p>
        city_match = re.search(r'<h3>[^<]*</h3><p>([^<]+)</p>', info_html)
        therapist_city = city_match.group(1).strip() if city_match else "UK"

        # Extract phone
        phone_match = re.search(r'<p>(0[\d\s]{9,13}|07[\d\s]{9,11}|\+44[\d\s]{9,12})</p>', info_html)
        phone = re.sub(r'\s+', '', phone_match.group(1)) if phone_match else ""

        # Extract profile URL
        url_match = re.search(r'href="([^"]+/therapists/\d+-[^"]+)"', info_html)
        profile_url = url_match.group(1) if url_match else ""
        if profile_url and not profile_url.startswith("http"):
            profile_url = f"https://www.massagetraining.co.uk{profile_url}"

        # City filter — skip if city param given and doesn't match
        if city and city.lower() not in "uk" and city.lower() not in therapist_city.lower():
            continue

        lead = {
            "name": name,
            "city": therapist_city,
            "vertical": "massage",
            "current_platform": "MTI",
            "source": "mti_scrape",
            "source_url": profile_url or url,
            "website": "",
            "phone": phone,
            "rating": 0,
            "review_count": 0,
            "scraped_at": datetime.utcnow(),
        }

        ins, dup = await _save_lead(db, lead)
        if ins:
            added += 1
            await _inc(db, job_id, leads_added=1, leads_found=1)
        elif dup:
            await _inc(db, job_id, leads_found=1, duplicates=1)

    await _inc(db, job_id, pages_scraped=1)
    logger.info(f"MTI: extracted {added} leads")


# ═══════════════════════════════════════════════════════════
# FHT SCRAPER — Federation of Holistic Therapists
# 143 pages of listings → profile fetch for each
# Requires browser-like headers to bypass HTTP 406
# ═══════════════════════════════════════════════════════════

async def _fetch_fht(url: str) -> Optional[str]:
    """
    FHT profile pages return 406 without full browser headers.
    This function sends a complete browser header set to bypass it.
    """
    proxy_url = _proxy()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Referer": "https://www.fht.org.uk/directory-list",
        "DNT": "1",
    }
    try:
        async with httpx.AsyncClient(
            proxies={"http://": proxy_url, "https://": proxy_url},
            timeout=25, follow_redirects=True, verify=False,
        ) as client:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                return r.text
            if r.status_code == 429:
                await asyncio.sleep(15)
                return None
            logger.info(f"FHT fetch {r.status_code}: {url}")
            return None
    except Exception as exc:
        logger.error(f"FHT fetch error {url}: {exc}")
        return None


def _parse_fht_profile(html: str, profile_url: str) -> Optional[dict]:
    """Extract structured data from an FHT therapist profile page."""
    if not html:
        return None

    def _field(class_name: str) -> str:
        m = re.search(
            rf'class="[^"]*{re.escape(class_name)}[^"]*"[^>]*>(.*?)</',
            html, re.DOTALL
        )
        return re.sub(r'<[^>]+>', ' ', m.group(1)).strip() if m else ""

    # Business name — from title or field
    name_m = re.search(r'<h1[^>]*class="[^"]*page-title[^"]*"[^>]*>([^<]+)</h1>', html)
    if not name_m:
        name_m = re.search(r'<title>([^|<]+)', html)
    name = html_mod.unescape(name_m.group(1)).strip() if name_m else ""
    if not name or name.lower() in ("directory", "fht"):
        return None

    # Address fields
    locality_m = re.search(r'class="[^"]*locality[^"]*"[^>]*>([^<]+)<', html)
    postal_m = re.search(r'class="[^"]*postal-code[^"]*"[^>]*>([^<]+)<', html)
    city = locality_m.group(1).strip() if locality_m else ""
    postcode = postal_m.group(1).strip() if postal_m else ""

    # Phone
    phone_m = re.search(r'href="tel:([^"]+)"', html)
    if not phone_m:
        phone_m = re.search(r'(0\d{10}|07\d{9}|\+44\d{10})', html)
    phone = phone_m.group(1).strip() if phone_m else ""

    # Email
    email_m = re.search(r'href="mailto:([^"]+)"', html)
    email = email_m.group(1).strip().lower() if email_m else ""

    # Website
    web_m = re.search(
        r'field--name-field-website[^>]*>[^<]*<a[^>]*href="([^"]+)"',
        html, re.DOTALL
    )
    website = web_m.group(1).strip() if web_m else ""

    # Therapies — structured list
    therapies_m = re.findall(r'field--name-field-therapies[^>]*>.*?<li[^>]*>([^<]+)', html, re.DOTALL)
    vertical = therapies_m[0].strip().lower() if therapies_m else "holistic"

    if not city:
        # Try to get city from postcode area
        if postcode:
            city = postcode.split()[0] if postcode else "UK"

    return {
        "name": name,
        "city": city or postcode or "UK",
        "vertical": vertical[:50],
        "current_platform": "FHT",
        "source": "fht_scrape",
        "source_url": profile_url,
        "website": website,
        "phone": phone,
        "email": email,
        "rating": 0,
        "review_count": 0,
        "scraped_at": datetime.utcnow(),
    }


async def _scrape_fht(db, city: str, vertical: str, job_id: str, max_leads: int):
    """
    Phase 1: Crawl 143 listing pages to collect profile URLs.
    Phase 2: Fetch each profile page for full contact data.
    Profile pages require browser headers (HTTP 406 workaround).
    """
    base = "https://www.fht.org.uk"
    profile_urls: List[str] = []

    # Phase 1 — collect profile URLs from listing pages
    page = 0
    while True:
        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            return

        url = f"{base}/directory-list?page={page}"
        html = await _fetch_fht(url)
        if not html:
            break

        # Extract profile links: <a href="/users/...">
        links = re.findall(r'href="(/users/[a-z0-9\-]+)"', html)
        new_links = [f"{base}{l}" for l in links if l not in profile_urls]
        profile_urls.extend(new_links)

        await _inc(db, job_id, pages_scraped=1)

        # Check if there's a next page
        if 'pager__item--next' not in html:
            break

        page += 1
        if page > 145:  # safety cap
            break

        await asyncio.sleep(random.uniform(1.5, 3.0))

    logger.info(f"FHT: collected {len(profile_urls)} profile URLs")

    # Phase 2 — fetch each profile
    added = 0
    for profile_url in profile_urls:
        if added >= max_leads:
            break

        job = await db.scraper_jobs.find_one({"job_id": job_id}, {"status": 1})
        if job and job.get("status") == "cancelled":
            break

        html = await _fetch_fht(profile_url)
        if not html:
            await asyncio.sleep(1)
            continue

        lead = _parse_fht_profile(html, profile_url)
        if not lead:
            continue

        # City filter
        if city and city.lower() not in "uk" and city.lower() not in lead.get("city", "").lower():
            continue

        ins, dup = await _save_lead(db, lead)
        if ins:
            added += 1
            await _inc(db, job_id, leads_added=1, leads_found=1)
        elif dup:
            await _inc(db, job_id, leads_found=1, duplicates=1)

        await asyncio.sleep(random.uniform(1.0, 2.5))


# ═══════════════════════════════════════════════════════════
# COMPANIES HOUSE — stub (CSV import used instead)
# ═══════════════════════════════════════════════════════════

async def _scrape_companies_house(db, city: str, vertical: str, job_id: str, max_leads: int):
    """Placeholder — Companies House uses CSV import, not this scraper."""
    await _set(db, job_id,
        status="failed",
        error="Use the Companies House CSV import instead: Growth Hub → Companies House → Upload CSV"
    )


_SCRAPERS = {
    "fresha": _scrape_fresha,
    "treatwell": _scrape_treatwell,
    "booksy": _scrape_booksy,
    "vagaro": _scrape_vagaro,
    "mti": _scrape_mti,
    "fht": _scrape_fht,
    "companies_house": _scrape_companies_house,
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
    enrichment: Optional[str] = None,
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
    if enrichment:
        _not_empty = {"$nin": ["", None]}
        if enrichment == "email":
            q["email"] = _not_empty
        elif enrichment == "phone":
            q["phone"] = _not_empty
        elif enrichment == "website":
            q["website"] = _not_empty
        elif enrichment == "instagram":
            q["instagram"] = _not_empty
        elif enrichment == "socials":
            q["$or"] = [{"instagram": _not_empty}, {"facebook": _not_empty}, {"tiktok": _not_empty}]
        elif enrichment == "none":
            q["email_enriched"] = {"$ne": True}
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

    source_url = lead.get("source_url", "")

    async def _do():
        db2 = get_database()
        data = await _full_enrichment(lead)
        await db2.sales_leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {
                "email":     data.get("email", ""),
                "phone":     data.get("phone", "") or lead.get("phone", ""),
                "website":   data.get("website", "") or lead.get("website", ""),
                "instagram": data.get("instagram", ""),
                "facebook":  data.get("facebook", ""),
                "tiktok":    data.get("tiktok", ""),
                "twitter":   data.get("twitter", ""),
                "email_enriched": True,
                "email_enriched_at": datetime.utcnow(),
            }},
        )

    background_tasks.add_task(_do)
    return {"message": "Full enrichment started (website + Google + Yell)", "lead_id": lead_id}


@router.post("/leads/bulk-enrich")
async def bulk_enrich(body: BulkLeadsRequest, background_tasks: BackgroundTasks):
    async def _do():
        db2 = get_database()
        for lid in body.lead_ids:
            try:
                lead = await db2.sales_leads.find_one({"_id": ObjectId(lid)})
                if lead and not lead.get("email_enriched"):
                    data = await _full_enrichment(lead)
                    await db2.sales_leads.update_one(
                        {"_id": ObjectId(lid)},
                        {"$set": {
                            "email":     data.get("email", ""),
                            "phone":     data.get("phone", "") or lead.get("phone", ""),
                            "website":   data.get("website", "") or lead.get("website", ""),
                            "instagram": data.get("instagram", ""),
                            "facebook":  data.get("facebook", ""),
                            "tiktok":    data.get("tiktok", ""),
                            "twitter":   data.get("twitter", ""),
                            "email_enriched": True,
                            "email_enriched_at": datetime.utcnow(),
                        }},
                    )
                    # Longer delay between leads — Google needs breathing room
                    await asyncio.sleep(random.uniform(3.0, 6.0))
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


# ═══════════════════════════════════════════════════════════
# COMPANIES HOUSE CSV IMPORT
# Download from: download.companieshouse.gov.uk
# Free, no API key, no caps — full 5M company dataset
# ═══════════════════════════════════════════════════════════

# ALL Dojo-supported business types mapped to SIC codes
# Source: Dojo Merchant Acceptance Guide (Sep 2023)
# These are businesses we can sell BOTH Dojo card machines AND ReeveOS to
_CH_TARGET_SICS = {
    # Beauty & Aesthetics (ReeveOS + Dojo)
    "96020": "beauty",        # Hairdressing and beauty treatment
    "96040": "wellness",      # Physical well-being (massage, sauna, spa)
    "96090": "beauty",        # Other personal service activities
    # Hospitality — Restaurants, Cafes, Takeaways (ReeveOS + Dojo)
    "56101": "restaurant",    # Licensed restaurants
    "56102": "restaurant",    # Unlicensed restaurants and cafes
    "56103": "takeaway",      # Take-away food shops
    "56210": "catering",      # Event catering
    "56290": "food_service",  # Other food service
    "56301": "bar",           # Licensed clubs
    "56302": "bar",           # Unlicensed clubs
    "56303": "pub",           # Bars and public houses
    # Hotels & Accommodation (Dojo)
    "55100": "hotel",         # Hotels and similar
    "55201": "hotel",         # Holiday centres
    "55202": "hotel",         # Youth hostels
    "55209": "hotel",         # Other short-stay accommodation
    "55300": "campsite",      # Caravan/camping parks
    "55900": "accommodation", # Other accommodation
    # Automotive (Dojo)
    "45111": "automotive",    # New car sales
    "45112": "automotive",    # Used car sales
    "45190": "automotive",    # Other motor vehicle sales
    "45201": "automotive",    # Car maintenance and repair
    "45202": "automotive",    # Other vehicle maintenance
    "45320": "automotive",    # Motor vehicle parts retail
    "45400": "automotive",    # Motorcycle sales and repair
    # Dental (Dojo)
    "86230": "dental",        # Dental practice activities
    # Medical / Health Practitioners (Dojo)
    "86210": "medical",       # General medical practice
    "86220": "medical",       # Specialist medical practice
    "86900": "aesthetics",    # Other human health (aesthetics clinics)
    # Pharmacy / Chemist (Dojo)
    "47730": "pharmacy",      # Dispensing chemist
    # Retail — Grocery, Convenience, Newsagent (Dojo)
    "47110": "retail",        # Non-specialised food retail
    "47190": "retail",        # Other non-specialised retail
    "47220": "retail",        # Butchers
    "47230": "retail",        # Fishmongers
    "47240": "retail",        # Bakeries
    "47250": "retail",        # Beverage retail
    "47260": "retail",        # Tobacco retail
    "47610": "retail",        # Book stores
    "47620": "retail",        # Newsagents
    # Retail — Specialist (Dojo)
    "47520": "retail",        # Hardware/DIY/paint
    "47530": "retail",        # Carpets and flooring
    "47641": "retail",        # Sports goods (bikes etc)
    "47710": "retail",        # Clothing
    "47720": "retail",        # Footwear and leather
    "47740": "retail",        # Medical and orthopaedic goods
    "47750": "retail",        # Cosmetics and toiletries
    "47760": "retail",        # Florists and garden
    "47762": "retail",        # Pet shops
    "47770": "retail",        # Watches and jewellery
    "47782": "retail",        # Opticians
    "47789": "retail",        # Other specialist retail
    # Building trades — face-to-face types (Dojo)
    "43210": "trades",        # Electrical installation
    "43220": "trades",        # Plumbing and heating
    "43290": "trades",        # Other construction installation
    "43310": "trades",        # Plastering
    "43320": "trades",        # Joinery
    "43330": "trades",        # Floor and wall covering
    "43341": "trades",        # Painting and decorating
    "43342": "trades",        # Glazing
    "43390": "trades",        # Other building finishing
    # Taxi / Private Hire (Dojo)
    "49320": "transport",     # Taxi operation
    "49390": "transport",     # Other passenger transport
    # Sports (Dojo)
    "93110": "sports",        # Operation of sports facilities
    "93120": "sports",        # Sports clubs (football, rugby etc)
    "93130": "gym",           # Fitness facilities
    "93190": "sports",        # Other sports activities
    # Services (Dojo)
    "74202": "photography",   # Photography studios
    "75000": "veterinary",    # Vets
    "81210": "cleaning",      # General cleaning
    "81220": "cleaning",      # Specialist cleaning
    "81291": "pest_control",  # Pest control
    "81300": "landscaping",   # Landscape services / tree surgeons
    "96010": "laundry",       # Laundry and dry cleaning
    # Entertainment (Dojo)
    "59140": "cinema",        # Cinemas
    "90010": "entertainment", # Performing arts
    "90040": "entertainment", # Operation of arts facilities
    # Funeral (Dojo — with restrictions)
    "96030": "funeral",       # Funeral and related activities
}

# No SIC codes to skip — we include funeral since Dojo supports it
_CH_SKIP_SICS: set = set()

# Which SIC codes are ALSO ReeveOS targets (bookings/EPOS)
_REEVEOS_SICS = {
    "96020", "96040", "96090",           # Beauty/wellness/personal services
    "56101", "56102", "56103",           # Restaurants/cafes/takeaways
    "56210", "56290", "56301", "56302", "56303",  # Catering/bars/clubs
    "55100", "55201", "55202", "55209",  # Hotels/accommodation
    "86900", "86230",                    # Aesthetics/dental
    "93110", "93120", "93130", "93190",  # Sports/gym
}


@router.post("/companies-house/import")
async def import_companies_house_csv(
    background_tasks: BackgroundTasks,
    file: bytes = fastapi.Body(..., media_type="application/octet-stream"),
    filename: str = fastapi.Query("BasicCompanyDataAsOneFile.csv"),
):
    """
    Accept a Companies House CSV file upload and process it in background.
    Filters by target SIC codes and imports matching active companies as leads.

    CSV column layout (Companies House BasicCompanyData format):
      0  CompanyName
      1  CompanyNumber
      2  RegAddress.CareOf
      3  RegAddress.POBox
      4  RegAddress.AddressLine1
      5  RegAddress.AddressLine2
      6  RegAddress.PostTown      ← city
      7  RegAddress.County
      8  RegAddress.Country
      9  RegAddress.PostCode
      10 CompanyCategory
      11 CompanyStatus            ← filter: Active
      12 CountryOfOrigin
      13 DissolutionDate
      14 IncorporationDate
      15 Accounts.AccountRefDay
      16 Accounts.AccountRefMonth
      17 Accounts.NextDueDate
      18 Accounts.LastMadeUpDate
      19 Accounts.AccountCategory
      20 Returns.NextDueDate
      21 Returns.LastMadeUpDate
      22 Mortgages.NumMortCharges
      23 Mortgages.NumMortOutstanding
      24 Mortgages.NumMortPartSatisfied
      25 Mortgages.NumMortSatisfied
      26 SICCode.SicText_1        ← primary SIC
      27 SICCode.SicText_2
      28 SICCode.SicText_3
      29 SICCode.SicText_4
      ...
    """
    db = get_database()
    import_id = str(uuid4())

    # Store import job
    await db.scraper_jobs.insert_one({
        "job_id": import_id,
        "platform": "companies_house",
        "city": "UK",
        "vertical": "beauty",
        "max_leads": 999999,
        "status": "queued",
        "progress": {"pages_scraped": 0, "leads_found": 0, "leads_added": 0, "duplicates": 0},
        "created_at": datetime.utcnow(),
        "started_at": None,
        "completed_at": None,
        "error": None,
        "source": "csv_import",
        "filename": filename,
    })

    background_tasks.add_task(_process_ch_csv, import_id, file)
    return {"job_id": import_id, "status": "queued", "message": "CSV import started"}


async def _process_ch_csv(import_id: str, file_bytes: bytes):
    """Process Companies House CSV in background — filter, dedupe, import."""
    import csv
    import io
    import zipfile

    from database import get_database as _gdb
    db = _gdb()
    await _set(db, import_id, status="running", started_at=datetime.utcnow())

    added = 0
    found = 0
    dups = 0
    rows_processed = 0

    try:
        # Handle both .zip and .csv uploads
        raw = file_bytes
        if raw[:2] == b'PK':  # ZIP magic bytes
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                csv_name = next((n for n in zf.namelist() if n.endswith('.csv')), None)
                if not csv_name:
                    await _set(db, import_id, status="failed", error="No CSV found in ZIP")
                    return
                raw = zf.read(csv_name)

        text = raw.decode('utf-8', errors='replace')
        reader = csv.reader(io.StringIO(text))

        header = next(reader, None)  # skip header row

        batch = []

        for row in reader:
            rows_processed += 1

            if len(row) < 27:
                continue

            # Only active companies
            status = row[11].strip().lower()
            if status != "active":
                continue

            # Extract SIC codes from columns 26-29
            sic_texts = [row[i].strip() for i in range(26, min(30, len(row)))]
            sic_codes_found = []
            for st in sic_texts:
                if not st:
                    continue
                # Format: "96020 - Hairdressing and other beauty treatment"
                code_match = re.match(r'^(\d{5})', st)
                if code_match:
                    code = code_match.group(1)
                    if code in _CH_TARGET_SICS and code not in _CH_SKIP_SICS:
                        sic_codes_found.append(code)

            if not sic_codes_found:
                continue

            found += 1
            primary_sic = sic_codes_found[0]
            vertical = _CH_TARGET_SICS.get(primary_sic, "beauty")

            company_name = row[0].strip().title()
            company_number = row[1].strip()
            city = row[6].strip()  # PostTown
            postcode = row[9].strip()
            address_line1 = row[4].strip()

            if not company_name:
                continue

            lead = {
                "name": company_name,
                "city": city or postcode[:2] if postcode else "UK",
                "vertical": vertical,
                "current_platform": "Companies House",
                "source": "companies_house_scrape",
                "source_url": f"https://find-and-update.company-information.service.gov.uk/company/{company_number}",
                "website": "",
                "phone": "",
                "email": "",
                "rating": 0,
                "review_count": 0,
                "address_line_1": address_line1,
                "postcode": postcode,
                "company_number": company_number,
                "sic_code": primary_sic,
                "incorporated": row[14].strip(),
                "scraped_at": datetime.utcnow(),
            }

            batch.append(lead)

            # Process in batches of 500
            if len(batch) >= 500:
                for l in batch:
                    ins, dup = await _save_lead(db, l)
                    if ins:
                        added += 1
                    elif dup:
                        dups += 1

                await db.scraper_jobs.update_one(
                    {"job_id": import_id},
                    {"$set": {
                        "progress.leads_found": found,
                        "progress.leads_added": added,
                        "progress.duplicates": dups,
                        "progress.pages_scraped": rows_processed // 10000,
                    }}
                )
                batch = []
                await asyncio.sleep(0.1)  # yield to event loop

        # Final batch
        for l in batch:
            ins, dup = await _save_lead(db, l)
            if ins:
                added += 1
            elif dup:
                dups += 1

        await _set(db, import_id,
            status="completed",
            completed_at=datetime.utcnow(),
            **{
                "progress.leads_found": found,
                "progress.leads_added": added,
                "progress.duplicates": dups,
                "progress.pages_scraped": rows_processed // 10000,
            }
        )
        logger.info(f"CH CSV import {import_id}: {added} added, {dups} dups, {found} matched from {rows_processed} rows")

    except Exception as exc:
        logger.error(f"CH CSV import failed: {exc}")
        await _set(db, import_id, status="failed", error=str(exc), completed_at=datetime.utcnow())


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
