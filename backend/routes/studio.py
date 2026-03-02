"""Studio API Routes"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("studio")
router = APIRouter(prefix="/api/studio", tags=["studio"])


class CaptureRequest(BaseModel):
    url: str
    viewport: str = "desktop"
    wait_extra: int = 1500
    dismiss_cookies: bool = True
    hide_overlays: bool = True
    scroll_lazy: bool = True


@router.post("/capture")
async def start_capture(req: CaptureRequest):
    from services.studio_capture import capture_website
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    if req.viewport not in ("desktop", "tablet", "mobile"):
        raise HTTPException(400, "viewport must be desktop, tablet, or mobile")
    result = await capture_website(
        url=url, viewport=req.viewport, wait_extra=req.wait_extra,
        dismiss_cookies=req.dismiss_cookies,
        hide_overlays=req.hide_overlays,
        scroll_lazy=req.scroll_lazy,
    )
    return result


@router.get("/jobs")
async def list_all_jobs(limit: int = 50):
    from services.studio_capture import list_jobs
    return list_jobs(limit)


@router.get("/jobs/{job_id}")
async def get_job_detail(job_id: str):
    from services.studio_capture import get_job
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.delete("/jobs/{job_id}")
async def delete_job_endpoint(job_id: str):
    from services.studio_capture import delete_job, get_job
    if not get_job(job_id):
        raise HTTPException(404, "Job not found")
    delete_job(job_id)
    return {"deleted": True, "job_id": job_id}
