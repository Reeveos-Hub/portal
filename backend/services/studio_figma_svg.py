"""
Studio Figma SVG Generator
===========================
Converts a design_map.json into a structured SVG file optimized
for Figma import. Each DOM element becomes an editable SVG node:
- Rectangles with fills, borders, rounded corners
- Text elements with proper font properties
- Image references
- Named groups for hierarchy

When imported into Figma, this produces an editable design file
with proper layer structure, not a flat rasterized image.

Author: Claude + Ambassador
Date: 2 March 2026
"""

import html
import json
import logging
import re
from pathlib import Path
from typing import Optional
from xml.sax.saxutils import escape

logger = logging.getLogger("studio")


def _clean_font(font_family: str) -> str:
    """Clean CSS font-family string for SVG."""
    if not font_family:
        return "sans-serif"
    # Take first font, strip quotes
    first = font_family.split(",")[0].strip().strip("'\"")
    return first or "sans-serif"


def _parse_border_radius(br: str) -> float:
    """Parse CSS border-radius to a single value."""
    if not br or br == "0px":
        return 0
    # Take first value
    match = re.search(r'([\d.]+)px', br)
    return float(match.group(1)) if match else 0


def _css_gradient_to_svg(gradient: str, node_id: int) -> Optional[str]:
    """Convert CSS gradient to SVG gradient definition."""
    if not gradient:
        return None
    # Basic linear-gradient support
    match = re.search(r'linear-gradient\((.+)\)', gradient)
    if not match:
        return None
    body = match.group(1)

    # Parse direction
    x1, y1, x2, y2 = "0", "0", "0", "1"  # default top-to-bottom
    if "to right" in body:
        x1, y1, x2, y2 = "0", "0", "1", "0"
    elif "to left" in body:
        x1, y1, x2, y2 = "1", "0", "0", "0"
    elif "to bottom" in body:
        x1, y1, x2, y2 = "0", "0", "0", "1"

    # Parse color stops
    colors = re.findall(r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))', body)
    if len(colors) < 2:
        return None

    stops = []
    for i, c in enumerate(colors):
        offset = i / (len(colors) - 1)
        stops.append(f'<stop offset="{offset:.2f}" stop-color="{c}"/>')

    return (
        f'<linearGradient id="grad_{node_id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">'
        + "".join(stops)
        + "</linearGradient>"
    )


def _parse_shadow(shadow: str) -> Optional[dict]:
    """Parse CSS box-shadow to SVG filter values."""
    if not shadow:
        return None
    # Parse: offsetX offsetY blurRadius color
    match = re.search(
        r'([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px(?:\s+([-\d.]+)px)?\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))',
        shadow
    )
    if not match:
        return None
    return {
        "dx": float(match.group(1)),
        "dy": float(match.group(2)),
        "blur": float(match.group(3)),
        "color": match.group(5),
    }


def generate_figma_svg(design_map: dict, output_path: Path,
                       include_images: bool = True) -> Path:
    """
    Generate a structured SVG from a design map.
    Optimized for Figma import with editable layers.
    """
    page = design_map.get("page", {})
    root = design_map.get("root")
    images_list = design_map.get("images", [])

    if not root:
        logger.warning("No root node in design map")
        return output_path

    width = page.get("width", 1440)
    height = page.get("height", 900)
    bg_color = page.get("bgColor", "#ffffff")
    title = escape(page.get("title", "Captured Page"))

    # Collect gradient/filter definitions
    defs = []
    elements = []

    # Shadow filter template
    shadow_filters = {}

    def _process_node(node: dict, parent_x: int = 0, parent_y: int = 0):
        """Recursively process a node into SVG elements."""
        nonlocal defs

        x = node.get("x", 0)
        y = node.get("y", 0)
        w = node.get("w", 0)
        h = node.get("h", 0)
        nid = node.get("id", 0)
        tag = node.get("tag", "div")
        opacity = node.get("opacity", 1)
        depth = node.get("depth", 0)

        if w < 2 or h < 2:
            return

        # Build group name for Figma layer naming
        text_preview = (node.get("text") or "")[:30]
        layer_name = escape(f"{tag}" + (f" — {text_preview}" if text_preview else ""))

        opacity_attr = f' opacity="{opacity}"' if opacity < 1 else ""

        group_parts = [f'<g id="node_{nid}" data-name="{layer_name}"{opacity_attr}>']

        # Background rectangle
        bg = node.get("bgColor")
        gradient = node.get("bgGradient")
        br = _parse_border_radius(node.get("borderRadius", "0px"))
        border_w = node.get("borderWidth", 0)
        border_c = node.get("borderColor")

        has_bg = bg or gradient or border_w > 0

        if has_bg:
            fill = "none"
            if gradient:
                grad_def = _css_gradient_to_svg(gradient, nid)
                if grad_def:
                    defs.append(grad_def)
                    fill = f"url(#grad_{nid})"
            elif bg:
                fill = bg

            rx_attr = f' rx="{br}" ry="{br}"' if br > 0 else ""
            stroke_attr = ""
            if border_w > 0 and border_c:
                stroke_attr = f' stroke="{border_c}" stroke-width="{border_w}"'

            group_parts.append(
                f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
                f'fill="{fill}"{rx_attr}{stroke_attr}/>'
            )

        # Shadow (as a slight visual indicator — full SVG shadows are complex)
        shadow = _parse_shadow(node.get("boxShadow"))
        if shadow and shadow["blur"] > 0:
            fid = f"shadow_{nid}"
            if fid not in shadow_filters:
                blur = shadow["blur"]
                defs.append(
                    f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="140%">'
                    f'<feDropShadow dx="{shadow["dx"]}" dy="{shadow["dy"]}" '
                    f'stdDeviation="{blur/2}" flood-color="{shadow["color"]}" flood-opacity="0.3"/>'
                    f'</filter>'
                )
                shadow_filters[fid] = True

        # Image
        img_src = node.get("imgSrc") or node.get("bgImage")
        if img_src and include_images:
            # Clip to element bounds
            clip_id = f"clip_{nid}"
            if br > 0:
                defs.append(
                    f'<clipPath id="{clip_id}">'
                    f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{br}" ry="{br}"/>'
                    f'</clipPath>'
                )
                group_parts.append(
                    f'<image href="{escape(img_src)}" x="{x}" y="{y}" '
                    f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice" '
                    f'clip-path="url(#{clip_id})"/>'
                )
            else:
                group_parts.append(
                    f'<image href="{escape(img_src)}" x="{x}" y="{y}" '
                    f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice"/>'
                )

        # SVG element (inline)
        if tag == "svg" and node.get("svg"):
            # Embed SVG content directly
            svg_content = node["svg"]
            group_parts.append(
                f'<g transform="translate({x},{y})">'
                f'<!-- inline SVG -->{svg_content}</g>'
            )

        # Text
        text = node.get("text")
        if text and len(text.strip()) > 0:
            color = node.get("color", "#000000") or "#000000"
            font_size = node.get("fontSize", 16)
            font_weight = node.get("fontWeight", "400")
            font_family = _clean_font(node.get("fontFamily", ""))
            text_align = node.get("textAlign", "left")

            # Figma respects these SVG text properties well
            anchor = {"left": "start", "center": "middle", "right": "end"}.get(text_align, "start")
            tx = x + (w/2 if anchor == "middle" else (w if anchor == "end" else 4))
            ty = y + font_size + 4  # Approximate baseline

            # Wrap long text
            escaped_text = escape(text)
            if len(text) > 60:
                # Split into tSpan lines for Figma
                words = text.split()
                lines = []
                current = ""
                chars_per_line = max(10, int(w / (font_size * 0.55)))
                for word in words:
                    if len(current) + len(word) + 1 > chars_per_line and current:
                        lines.append(current)
                        current = word
                    else:
                        current = (current + " " + word).strip()
                if current:
                    lines.append(current)

                tspans = ""
                for i, line in enumerate(lines):
                    dy_attr = f' dy="{font_size * 1.2}"' if i > 0 else ""
                    tspans += f'<tspan x="{tx}"{dy_attr}>{escape(line)}</tspan>'

                group_parts.append(
                    f'<text x="{tx}" y="{ty}" fill="{color}" '
                    f'font-size="{font_size}" font-weight="{font_weight}" '
                    f'font-family="{escape(font_family)}" '
                    f'text-anchor="{anchor}">{tspans}</text>'
                )
            else:
                group_parts.append(
                    f'<text x="{tx}" y="{ty}" fill="{color}" '
                    f'font-size="{font_size}" font-weight="{font_weight}" '
                    f'font-family="{escape(font_family)}" '
                    f'text-anchor="{anchor}">{escaped_text}</text>'
                )

        # Process children
        for child in node.get("children", []):
            _process_node(child, x, y)

        group_parts.append("</g>")
        elements.append("\n".join(group_parts))

    # Process all nodes
    _process_node(root)

    # Build final SVG
    defs_str = "\n".join(defs) if defs else ""

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{width}" height="{height}"
     viewBox="0 0 {width} {height}">

  <title>{title}</title>

  <defs>
    {defs_str}
  </defs>

  <!-- Page background -->
  <rect width="{width}" height="{height}" fill="{bg_color}"/>

  <!-- Design elements -->
  {chr(10).join(elements)}

</svg>'''

    output_path.write_text(svg, encoding="utf-8")
    file_size_mb = round(output_path.stat().st_size / (1024 * 1024), 2)
    logger.info(f"Generated Figma SVG: {output_path} ({file_size_mb}MB, "
                f"{len(elements)} groups)")

    return output_path
