"""
Studio DOM Extractor v2
========================
Extracts a complete design map from a live web page via Playwright.
Downloads images and converts to base64 for embedding in output formats.

Author: Claude + Ambassador
Date: 2 March 2026
"""

import json
import logging
from pathlib import Path
from playwright.async_api import Page

logger = logging.getLogger("studio")


DOM_EXTRACT_JS = r"""
() => {
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'BR', 'WBR', 'IFRAME']);
    const MAX_ELEMENTS = 3000;
    const MIN_SIZE = 1;
    const images = [];
    let nodeId = 0;

    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return rgb;
        const [_, r, g, b, a] = match;
        if (a !== undefined && parseFloat(a) === 0) return null;
        return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }

    function getDirectText(el) {
        let text = '';
        for (const child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                const t = child.textContent.trim();
                if (t) text += (text ? ' ' : '') + t;
            }
        }
        return text;
    }

    function extractNode(el, depth) {
        if (nodeId >= MAX_ELEMENTS) return null;
        if (SKIP_TAGS.has(el.tagName)) return null;

        const rect = el.getBoundingClientRect();
        const sx = window.scrollX || 0;
        const sy = window.scrollY || 0;
        const x = Math.round(rect.left + sx);
        const y = Math.round(rect.top + sy);
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        if (w < MIN_SIZE || h < MIN_SIZE) return null;

        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return null;
        if (parseFloat(cs.opacity) === 0) return null;

        const id = nodeId++;
        const tag = el.tagName.toLowerCase();
        const bgColor = rgbToHex(cs.backgroundColor);
        const color = rgbToHex(cs.color);
        const fontSize = parseFloat(cs.fontSize) || 16;
        const fontWeight = cs.fontWeight;
        const fontFamily = cs.fontFamily;
        const textAlign = cs.textAlign;
        const borderRadius = cs.borderRadius;
        const borderWidth = parseFloat(cs.borderTopWidth) || 0;
        const borderColor = rgbToHex(cs.borderTopColor);
        const boxShadow = cs.boxShadow !== 'none' ? cs.boxShadow : null;
        const opacity = parseFloat(cs.opacity);
        const bgImage = cs.backgroundImage !== 'none' ? cs.backgroundImage : null;

        let imgSrc = null;
        if (tag === 'img') {
            imgSrc = el.currentSrc || el.src || null;
            if (imgSrc) images.push({ id, src: imgSrc, x, y, w, h });
        }

        let bgImgUrl = null;
        if (bgImage && bgImage.startsWith('url(')) {
            const m = bgImage.match(/url\(["']?(.+?)["']?\)/);
            if (m) { bgImgUrl = m[1]; images.push({ id, src: bgImgUrl, x, y, w, h, isBg: true }); }
        }

        let svgContent = null;
        if (tag === 'svg') {
            try {
                const s = new XMLSerializer().serializeToString(el);
                if (s.length < 10000) svgContent = s;
            } catch(e) {}
        }

        const text = getDirectText(el);

        const node = {
            id, tag, x, y, w, h, depth,
            bgColor, color, fontSize, fontWeight, fontFamily,
            textAlign, borderRadius, borderWidth, borderColor,
            boxShadow, opacity: opacity < 1 ? opacity : undefined,
            bgImage: bgImgUrl,
            bgGradient: (bgImage && bgImage.includes('gradient')) ? bgImage : null,
            imgSrc, svgContent,
            text: text || undefined,
            children: []
        };

        if (depth < 20) {
            for (const child of el.children) {
                const cn = extractNode(child, depth + 1);
                if (cn) node.children.push(cn);
            }
        }
        return node;
    }

    const body = document.body;
    if (!body) return { root: null, images: [], page: {} };
    const root = extractNode(body, 0);

    return {
        root,
        images,
        page: {
            title: document.title || '',
            url: location.href,
            width: Math.max(body.scrollWidth, document.documentElement.scrollWidth),
            height: Math.max(body.scrollHeight, document.documentElement.scrollHeight),
            bgColor: rgbToHex(getComputedStyle(body).backgroundColor) || '#ffffff',
            fonts: [...new Set(
                [...document.querySelectorAll('body *')].slice(0, 500)
                .map(el => getComputedStyle(el).fontFamily).filter(f => f)
            )].slice(0, 30),
        },
        nodeCount: nodeId
    };
}
"""


async def _download_images(page: Page, images: list, max_images: int = 50) -> dict:
    """Download images via canvas and return {url: data_uri} map."""
    seen = set()
    unique = []
    for img in images[:max_images]:
        src = img.get("src", "")
        if src and src not in seen and src.startswith("http"):
            seen.add(src)
            unique.append(src)

    if not unique:
        return {}

    logger.info(f"Downloading {len(unique)} images as base64...")

    result = await page.evaluate("""(urls) => {
        return Promise.all(urls.map(url => {
            return new Promise(resolve => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const c = document.createElement('canvas');
                        c.width = Math.min(img.naturalWidth || img.width, 1200);
                        c.height = Math.min(img.naturalHeight || img.height, 1200);
                        const ctx = c.getContext('2d');
                        ctx.drawImage(img, 0, 0, c.width, c.height);
                        resolve({ url, data: c.toDataURL('image/png', 0.85) });
                    } catch(e) { resolve({ url, data: null }); }
                };
                img.onerror = () => resolve({ url, data: null });
                setTimeout(() => resolve({ url, data: null }), 5000);
                img.src = url;
            });
        }));
    }""", unique)

    img_map = {}
    for item in (result or []):
        if item and item.get("data"):
            img_map[item["url"]] = item["data"]

    logger.info(f"Downloaded {len(img_map)}/{len(unique)} images")
    return img_map


async def extract_design_map(page: Page, job_dir: Path) -> dict:
    """Extract complete design map with embedded base64 images."""
    logger.info("Extracting DOM design map v2...")

    try:
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)

        design_map = await page.evaluate(DOM_EXTRACT_JS)
        if not design_map or not design_map.get("root"):
            logger.warning("DOM extraction returned empty")
            return {}

        nc = design_map.get("nodeCount", 0)
        ic = len(design_map.get("images", []))
        logger.info(f"Extracted {nc} nodes, {ic} images")

        # Download images as base64
        img_data = await _download_images(page, design_map.get("images", []))
        design_map["image_data"] = img_data

        # Save
        map_path = job_dir / "design_map.json"
        map_path.write_text(json.dumps(design_map, indent=2, default=str))
        return design_map

    except Exception as e:
        logger.exception(f"DOM extraction failed: {e}")
        return {}


def flatten_nodes(node, result=None):
    if result is None: result = []
    if node:
        result.append(node)
        for c in node.get("children", []): flatten_nodes(c, result)
    return result
