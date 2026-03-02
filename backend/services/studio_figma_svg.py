"""
Studio Figma SVG Generator v2
===============================
Converts design_map.json to structured SVG for Figma import.
Uses base64-embedded images so Figma can render them.
Every visible element gets a proper SVG representation.

Author: Claude + Ambassador
Date: 2 March 2026
"""

import json
import logging
import re
from pathlib import Path
from xml.sax.saxutils import escape

logger = logging.getLogger("studio")


def _clean_font(ff):
    if not ff: return "sans-serif"
    return ff.split(",")[0].strip().strip("'\"") or "sans-serif"


def _parse_br(br):
    if not br or br == "0px": return 0
    m = re.search(r'([\d.]+)', br)
    return float(m.group(1)) if m else 0


def generate_figma_svg(design_map: dict, output_path: Path, include_images: bool = True) -> Path:
    page = design_map.get("page", {})
    root = design_map.get("root")
    img_data = design_map.get("image_data", {})  # {url: data_uri}

    if not root:
        logger.warning("No root node")
        return output_path

    W = page.get("width", 1440)
    H = page.get("height", 900)
    bg = page.get("bgColor", "#ffffff")
    title = escape(page.get("title", "Page"))

    defs = []
    elems = []

    def node_svg(n, parent_clip=None):
        x = n.get("x", 0)
        y = n.get("y", 0)
        w = n.get("w", 0)
        h = n.get("h", 0)
        nid = n.get("id", 0)
        tag = n.get("tag", "div")
        depth = n.get("depth", 0)

        if w < 2 or h < 2:
            # Still process children
            for c in n.get("children", []):
                node_svg(c)
            return

        opa = n.get("opacity")
        opa_attr = f' opacity="{opa}"' if opa and opa < 1 else ""

        text_preview = (n.get("text") or "")[:25]
        lbl = escape(f"{tag}" + (f": {text_preview}" if text_preview else ""))

        parts = [f'<g id="n{nid}" data-name="{lbl}"{opa_attr}>']

        bg_col = n.get("bgColor")
        br = _parse_br(n.get("borderRadius", ""))
        bw = n.get("borderWidth", 0)
        bc = n.get("borderColor")
        rx = f' rx="{br}" ry="{br}"' if br > 0 else ""
        stroke = f' stroke="{bc}" stroke-width="{bw}"' if bw > 0 and bc else ""

        # Background rect — always draw if element has bg, border, or is a major container
        if bg_col:
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg_col}"{rx}{stroke}/>')
        elif bw > 0 and bc:
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none"{rx}{stroke}/>')

        # Gradient background
        grad = n.get("bgGradient")
        if grad:
            gm = re.search(r'linear-gradient\((.+)\)', grad)
            if gm:
                body = gm.group(1)
                x1, y1, x2, y2 = "0", "0", "0", "1"
                if "to right" in body: x1, y1, x2, y2 = "0", "0", "1", "0"
                elif "to left" in body: x1, y1, x2, y2 = "1", "0", "0", "0"
                colors = re.findall(r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))', body)
                if len(colors) >= 2:
                    stops = "".join(f'<stop offset="{i/(len(colors)-1):.2f}" stop-color="{c}"/>' for i, c in enumerate(colors))
                    defs.append(f'<linearGradient id="g{nid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stops}</linearGradient>')
                    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#g{nid})"{rx}/>')

        # Image (use base64 if available, otherwise external URL)
        img_src = n.get("imgSrc") or n.get("bgImage")
        if img_src and include_images:
            # Prefer base64 data
            data_uri = img_data.get(img_src, "")
            href = data_uri if data_uri else img_src

            if br > 0:
                cid = f"c{nid}"
                defs.append(f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{br}" ry="{br}"/></clipPath>')
                parts.append(f'<image href="{escape(href)}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#{cid})"/>')
            else:
                parts.append(f'<image href="{escape(href)}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice"/>')

            # If no base64, draw a placeholder rect so it's visible
            if not data_uri and not bg_col:
                parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#e8e8e8" stroke="#cccccc" stroke-width="1"{rx}/>')
                parts.append(f'<text x="{x + w/2}" y="{y + h/2}" fill="#999" font-size="11" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">[image]</text>')

        # Inline SVG
        if tag == "svg" and n.get("svgContent"):
            parts.append(f'<g transform="translate({x},{y})">{n["svgContent"]}</g>')

        # Text
        text = n.get("text")
        if text and text.strip():
            col = n.get("color", "#000000") or "#000000"
            fs = n.get("fontSize", 16)
            fw = n.get("fontWeight", "400")
            ff = _clean_font(n.get("fontFamily", ""))
            ta = n.get("textAlign", "left")

            anchor = {"left": "start", "center": "middle", "right": "end"}.get(ta, "start")
            tx = x + (w/2 if anchor == "middle" else (w - 4 if anchor == "end" else 4))
            ty = y + fs + (h - fs) / 2  # Vertical center baseline

            # Word wrap for long text
            chars_per_line = max(10, int(w / (fs * 0.55))) if w > 0 else 40
            words = text.split()

            if len(text) > chars_per_line:
                lines = []
                cur = ""
                for word in words:
                    if len(cur) + len(word) + 1 > chars_per_line and cur:
                        lines.append(cur)
                        cur = word
                    else:
                        cur = (cur + " " + word).strip()
                if cur: lines.append(cur)

                tspans = ""
                for i, line in enumerate(lines[:10]):  # Max 10 lines
                    dy = f' dy="{fs * 1.25}"' if i > 0 else ""
                    tspans += f'<tspan x="{tx}"{dy}>{escape(line)}</tspan>'

                parts.append(
                    f'<text x="{tx}" y="{ty}" fill="{col}" font-size="{fs}" '
                    f'font-weight="{fw}" font-family="{escape(ff)}" text-anchor="{anchor}">'
                    f'{tspans}</text>')
            else:
                parts.append(
                    f'<text x="{tx}" y="{ty}" fill="{col}" font-size="{fs}" '
                    f'font-weight="{fw}" font-family="{escape(ff)}" text-anchor="{anchor}">'
                    f'{escape(text)}</text>')

        # Process children
        for c in n.get("children", []):
            node_svg(c)

        parts.append("</g>")
        elems.append("\n".join(parts))

    # Process tree
    node_svg(root)

    defs_str = "\n    ".join(defs)
    elems_str = "\n  ".join(elems)

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{W}" height="{H}"
     viewBox="0 0 {W} {H}">
  <title>{title}</title>
  <defs>
    {defs_str}
  </defs>
  <rect width="{W}" height="{H}" fill="{bg}" data-name="page-background"/>
  {elems_str}
</svg>'''

    output_path.write_text(svg, encoding="utf-8")
    mb = round(output_path.stat().st_size / (1024*1024), 2)
    logger.info(f"Figma SVG: {output_path} ({mb}MB, {len(elems)} groups)")
    return output_path
