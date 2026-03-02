"""
Studio DOM Extractor
====================
Extracts a complete design map from a live web page via Playwright.
Captures every visible element's bounding box, computed styles,
text content, and image references.

Output: design_map.json — a structured representation of the page
that can be converted to Figma, SVG, or other design formats.

Author: Claude + Ambassador
Date: 2 March 2026
"""

import json
import logging
from pathlib import Path
from playwright.async_api import Page

logger = logging.getLogger("studio")


# ── JavaScript DOM extraction (runs in browser) ──────────────────────

DOM_EXTRACT_JS = """
() => {
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'BR', 'WBR']);
    const MAX_ELEMENTS = 2000;
    const MIN_SIZE = 2; // Skip elements smaller than 2px

    const nodes = [];
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

    function getTextContent(el) {
        // Get direct text content (not from children)
        let text = '';
        for (const child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                const t = child.textContent.trim();
                if (t) text += (text ? ' ' : '') + t;
            }
        }
        return text;
    }

    function extractElement(el, depth) {
        if (nodeId >= MAX_ELEMENTS) return null;
        if (SKIP_TAGS.has(el.tagName)) return null;

        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;

        // Absolute position on page (not viewport)
        const x = rect.left + scrollX;
        const y = rect.top + scrollY;
        const w = rect.width;
        const h = rect.height;

        // Skip invisible/tiny elements
        if (w < MIN_SIZE || h < MIN_SIZE) return null;

        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return null;
        if (parseFloat(style.opacity) === 0) return null;

        const id = nodeId++;
        const tag = el.tagName.toLowerCase();

        // Core style properties
        const bgColor = rgbToHex(style.backgroundColor);
        const color = rgbToHex(style.color);
        const borderColor = rgbToHex(style.borderTopColor);
        const fontSize = parseFloat(style.fontSize) || 16;
        const fontWeight = style.fontWeight;
        const fontFamily = style.fontFamily;
        const lineHeight = style.lineHeight;
        const textAlign = style.textAlign;
        const borderRadius = style.borderRadius;
        const borderWidth = parseFloat(style.borderTopWidth) || 0;
        const boxShadow = style.boxShadow !== 'none' ? style.boxShadow : null;
        const opacity = parseFloat(style.opacity);
        const overflow = style.overflow;

        // Background image/gradient
        const bgImage = style.backgroundImage !== 'none' ? style.backgroundImage : null;

        // Text content (direct only, not children)
        const text = getTextContent(el);

        // Image handling
        let imgSrc = null;
        if (tag === 'img') {
            imgSrc = el.currentSrc || el.src || null;
            if (imgSrc) images.push({ id, src: imgSrc, x, y, w, h });
        }

        // SVG handling
        if (tag === 'svg') {
            try {
                const svgStr = new XMLSerializer().serializeToString(el);
                return {
                    id, tag: 'svg', x, y, w, h, depth,
                    svg: svgStr.length < 5000 ? svgStr : null,
                    opacity, children: []
                };
            } catch(e) {}
        }

        // Background image (CSS)
        let bgImgUrl = null;
        if (bgImage && bgImage.startsWith('url(')) {
            const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
            if (match) {
                bgImgUrl = match[1];
                images.push({ id, src: bgImgUrl, x, y, w, h, isBg: true });
            }
        }

        const node = {
            id, tag, x: Math.round(x), y: Math.round(y),
            w: Math.round(w), h: Math.round(h), depth,
            // Styles
            bgColor, color, fontSize, fontWeight, fontFamily,
            lineHeight, textAlign, borderRadius, borderWidth,
            borderColor, boxShadow, opacity,
            bgImage: bgImgUrl,
            bgGradient: (bgImage && bgImage.includes('gradient')) ? bgImage : null,
            // Content
            text: text || null,
            imgSrc,
            // Hierarchy
            children: []
        };

        // Process children (limit depth)
        if (depth < 15) {
            for (const child of el.children) {
                const childNode = extractElement(child, depth + 1);
                if (childNode) node.children.push(childNode);
            }
        }

        return node;
    }

    // Start extraction from body
    const body = document.body;
    if (!body) return { nodes: [], images: [], page: {} };

    const root = extractElement(body, 0);

    // Get page-level info
    const pageInfo = {
        title: document.title || '',
        width: Math.max(body.scrollWidth, document.documentElement.scrollWidth),
        height: Math.max(body.scrollHeight, document.documentElement.scrollHeight),
        bgColor: rgbToHex(getComputedStyle(body).backgroundColor) || '#ffffff',
        fonts: [...new Set(
            [...document.querySelectorAll('body *')].slice(0, 500)
            .map(el => getComputedStyle(el).fontFamily)
            .filter(f => f)
        )].slice(0, 30),
    };

    return {
        root: root,
        images: images,
        page: pageInfo,
        nodeCount: nodeId
    };
}
"""


async def extract_design_map(page: Page, job_dir: Path) -> dict:
    """
    Extract a complete design map from the current page.
    Runs JavaScript in the browser to capture all visible elements.
    Returns the design map dict and saves to job_dir/design_map.json.
    """
    logger.info("Extracting DOM design map...")

    try:
        # Scroll to top first
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)

        # Run extraction
        design_map = await page.evaluate(DOM_EXTRACT_JS)

        if not design_map or not design_map.get("root"):
            logger.warning("DOM extraction returned empty result")
            return {}

        logger.info(f"Extracted {design_map.get('nodeCount', 0)} nodes, "
                    f"{len(design_map.get('images', []))} images")

        # Save to disk
        map_path = job_dir / "design_map.json"
        map_path.write_text(json.dumps(design_map, indent=2))

        return design_map

    except Exception as e:
        logger.exception(f"DOM extraction failed: {e}")
        return {}


def flatten_nodes(node: dict, result: list = None) -> list:
    """Flatten the hierarchical node tree into a flat list sorted by depth/position."""
    if result is None:
        result = []
    if node:
        result.append(node)
        for child in node.get("children", []):
            flatten_nodes(child, result)
    return result
