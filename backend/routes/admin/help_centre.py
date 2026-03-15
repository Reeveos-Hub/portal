"""
Help Centre — /admin/help-centre
Manages knowledge base categories and articles for reeveos.app/help-centre
All content stored in MongoDB: help_categories + help_articles
Screenshots stored as base64 or file uploads per step.
"""
from fastapi import Depends, APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import base64
import logging

import database
from middleware.auth import get_current_admin

router = APIRouter(prefix="/admin/help-centre", tags=["help-centre"], dependencies=[Depends(get_current_admin)])
logger = logging.getLogger("help_centre")


# ─── Serialiser ────────────────────────────────────────────

def _ser(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    for k in ("created_at", "updated_at"):
        if k in doc and isinstance(doc[k], datetime):
            doc[k] = doc[k].isoformat()
    return doc


# ─── Models ────────────────────────────────────────────────

class StepModel(BaseModel):
    text: str
    screenshot: bool = False
    screenshot_url: Optional[str] = None   # base64 data URI or CDN URL


class SectionModel(BaseModel):
    title: Optional[str] = None
    steps: List[StepModel] = []


class FaqModel(BaseModel):
    q: str
    a: str


class CategoryCreate(BaseModel):
    title: str
    slug: str
    icon: str = "📄"
    description: str = ""
    sort_order: int = 99


class CategoryUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class ArticleCreate(BaseModel):
    title: str
    slug: str
    category_id: str
    intro: str = ""
    toc: List[str] = []
    sections: List[SectionModel] = []
    faqs: List[FaqModel] = []
    related: List[str] = []
    status: str = "published"   # published | draft


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[str] = None
    intro: Optional[str] = None
    toc: Optional[List[str]] = None
    sections: Optional[List[SectionModel]] = None
    faqs: Optional[List[FaqModel]] = None
    related: Optional[List[str]] = None
    status: Optional[str] = None


# ──────────────────────────────────────────────────────────
# CATEGORIES
# ──────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories():
    db = await database.get_db()
    cats = await db.help_categories.find().sort("sort_order", 1).to_list(None)
    # Enrich with article count
    for cat in cats:
        cat["article_count"] = await db.help_articles.count_documents({
            "category_id": str(cat["_id"]),
            "status": "published"
        })
    return {"categories": [_ser(c) for c in cats]}


@router.post("/categories")
async def create_category(data: CategoryCreate):
    db = await database.get_db()
    # Check slug unique
    existing = await db.help_categories.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(400, f"Slug '{data.slug}' already exists")
    doc = {
        **data.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.help_categories.insert_one(doc)
    created = await db.help_categories.find_one({"_id": result.inserted_id})
    return {"category": _ser(created)}


@router.put("/categories/{category_id}")
async def update_category(category_id: str, data: CategoryUpdate):
    db = await database.get_db()
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.help_categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Category not found")
    updated = await db.help_categories.find_one({"_id": ObjectId(category_id)})
    return {"category": _ser(updated)}


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    db = await database.get_db()
    # Don't delete if articles exist
    count = await db.help_articles.count_documents({"category_id": category_id})
    if count > 0:
        raise HTTPException(400, f"Cannot delete — {count} article(s) still in this category. Move or delete them first.")
    result = await db.help_categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Category not found")
    return {"ok": True}


# ──────────────────────────────────────────────────────────
# ARTICLES
# ──────────────────────────────────────────────────────────

@router.get("/articles")
async def list_articles(
    category_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    db = await database.get_db()
    query = {}
    if category_id:
        query["category_id"] = category_id
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"intro": {"$regex": q, "$options": "i"}},
        ]
    articles = await db.help_articles.find(query).sort("title", 1).to_list(None)
    return {"articles": [_ser(a) for a in articles]}


@router.get("/articles/{article_id}")
async def get_article(article_id: str):
    db = await database.get_db()
    article = await db.help_articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(404, "Article not found")
    return {"article": _ser(article)}


@router.post("/articles")
async def create_article(data: ArticleCreate):
    db = await database.get_db()
    existing = await db.help_articles.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(400, f"Slug '{data.slug}' already exists")
    doc = {
        **data.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.help_articles.insert_one(doc)
    created = await db.help_articles.find_one({"_id": result.inserted_id})
    return {"article": _ser(created)}


@router.put("/articles/{article_id}")
async def update_article(article_id: str, data: ArticleUpdate):
    db = await database.get_db()
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    updates["updated_at"] = datetime.utcnow()

    # Convert nested pydantic models to dicts
    if "sections" in updates:
        updates["sections"] = [s.dict() if hasattr(s, 'dict') else s for s in updates["sections"]]
    if "faqs" in updates:
        updates["faqs"] = [f.dict() if hasattr(f, 'dict') else f for f in updates["faqs"]]

    result = await db.help_articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Article not found")
    updated = await db.help_articles.find_one({"_id": ObjectId(article_id)})
    return {"article": _ser(updated)}


@router.delete("/articles/{article_id}")
async def delete_article(article_id: str):
    db = await database.get_db()
    result = await db.help_articles.delete_one({"_id": ObjectId(article_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Article not found")
    return {"ok": True}


# ──────────────────────────────────────────────────────────
# SCREENSHOT UPLOAD — per step, per article
# ──────────────────────────────────────────────────────────

@router.post("/articles/{article_id}/screenshot")
async def upload_screenshot(
    article_id: str,
    section_index: int = Query(...),
    step_index: int = Query(...),
    file: UploadFile = File(...),
):
    """
    Upload a screenshot for a specific step in an article.
    Stores as base64 data URI directly on the step object in MongoDB.
    Max 2MB per screenshot.
    """
    db = await database.get_db()
    article = await db.help_articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(404, "Article not found")

    # Validate
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Only JPEG, PNG, or WebP screenshots are accepted")

    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(400, "Screenshot must be under 2MB")

    # Encode as data URI
    b64 = base64.b64encode(contents).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    # Update the specific step
    sections = article.get("sections", [])
    if section_index >= len(sections):
        raise HTTPException(400, f"Section index {section_index} out of range")
    steps = sections[section_index].get("steps", [])
    if step_index >= len(steps):
        raise HTTPException(400, f"Step index {step_index} out of range")

    sections[section_index]["steps"][step_index]["screenshot_url"] = data_uri
    sections[section_index]["steps"][step_index]["screenshot"] = True

    await db.help_articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": {"sections": sections, "updated_at": datetime.utcnow()}}
    )

    return {"ok": True, "screenshot_url": data_uri[:80] + "..."}


# ──────────────────────────────────────────────────────────
# SEED — import all articles from the JS data file
# ──────────────────────────────────────────────────────────

@router.post("/seed")
async def seed_from_js(payload: dict):
    """
    Accept categories and articles from the frontend JS data file
    and insert them into MongoDB. Only runs if collections are empty.
    Idempotent — won't duplicate.
    """
    db = await database.get_db()
    categories = payload.get("categories", [])
    articles = payload.get("articles", [])

    cat_count = await db.help_categories.count_documents({})
    art_count = await db.help_articles.count_documents({})

    if cat_count > 0 or art_count > 0:
        return {
            "ok": False,
            "message": f"Already seeded — {cat_count} categories, {art_count} articles in DB. Use /seed-force to overwrite.",
            "categories": cat_count,
            "articles": art_count,
        }

    now = datetime.utcnow()

    # Insert categories
    cat_id_map = {}  # old js id -> new mongo id
    for i, cat in enumerate(categories):
        doc = {
            "title": cat["title"],
            "slug": cat["id"],
            "icon": cat.get("icon", "📄"),
            "description": cat.get("desc", ""),
            "sort_order": i,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.help_categories.insert_one(doc)
        cat_id_map[cat["id"]] = str(result.inserted_id)

    # Insert articles
    inserted_articles = 0
    for art in articles:
        category_mongo_id = cat_id_map.get(art.get("categoryId", ""))
        if not category_mongo_id:
            continue
        doc = {
            "title": art["title"],
            "slug": art["id"],
            "category_id": category_mongo_id,
            "intro": art.get("intro", ""),
            "toc": art.get("toc", []),
            "sections": art.get("sections", []),
            "faqs": art.get("faqs", []),
            "related": art.get("related", []),
            "status": "published",
            "created_at": now,
            "updated_at": now,
        }
        await db.help_articles.insert_one(doc)
        inserted_articles += 1

    return {
        "ok": True,
        "categories_inserted": len(cat_id_map),
        "articles_inserted": inserted_articles,
    }
