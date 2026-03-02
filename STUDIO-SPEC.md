# Studio — Full-Page Website Capture to Figma
## Architecture Specification & Build Plan
### ReeveOS Design Tool — v1.0

---

## 1. WHAT WE'RE BUILDING

A tool inside the ReeveOS admin panel that lets a user:

1. **Paste a URL**
2. **Pick a viewport** (Desktop 1440 / Tablet 768 / Mobile 375)
3. **Hit Capture**
4. **Get a super high-res full-page screenshot** (3x retina)
5. **Get a structured design tree** (every element, style, position)
6. **Push to Figma** as fully editable, layered frames

No third-party APIs. No external dependencies. We own the full pipeline.

---

## 2. THE PIPELINE — 4 STAGES

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  STAGE 1     │     │  STAGE 2     │     │  STAGE 3     │     │  STAGE 4     │
│  CAPTURE     │────▶│  EXTRACT     │────▶│  ENHANCE     │────▶│  FIGMA       │
│              │     │              │     │              │     │              │
│  Playwright  │     │  CDP DOM     │     │  AI Layer    │     │  Plugin      │
│  + Stealth   │     │  Snapshot    │     │  Intelligence│     │  Node        │
│  + Consent   │     │  + Assets    │     │  (Claude)    │     │  Creation    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     VPS                  VPS                  VPS                 Figma
```

---

## 3. STAGE 1 — CAPTURE SERVICE

**Location:** Backend API endpoint on VPS — `POST /api/studio/capture`
**Tech:** Python + Playwright (async) + playwright-stealth + autoconsent

### What it does:
- Launches headless Chromium with stealth mode (avoids bot detection)
- Sets viewport to requested size × 3x device pixel ratio
- Navigates to URL with `wait_until: networkidle`
- Runs autoconsent to dismiss cookie banners
- Pre-scrolls the entire page to trigger lazy-loaded images
- Scrolls back to top
- Captures full-page PNG at 3x resolution
- If page > 16,384px tall: captures in sections and stitches

### Input:
```json
{
  "url": "https://starlingbank.com",
  "viewport": "desktop",
  "wait_extra": 2000
}
```

### Output:
```json
{
  "job_id": "studio_abc123",
  "screenshot_url": "/studio/jobs/studio_abc123/screenshot.png",
  "status": "captured",
  "page_height": 8420,
  "capture_resolution": "4320x25260"
}
```

### Open source foundations:
- `playwright` — headless browser
- `playwright-stealth` — anti-bot-detection (via playwright-extra)
- `@anthropic/autoconsent` or `playwright-autoconsent` — cookie banner dismissal
- Custom: lazy-load scroll, section stitching for tall pages

---

## 4. STAGE 2 — DOM EXTRACTION

**Location:** Runs inside the same Playwright browser context (before closing)
**Tech:** Chrome DevTools Protocol (CDP) + custom extraction script

### What it does:
After capture, while the page is still loaded, we execute two things:

**A) CDP DOMSnapshot** — one call gets everything:
```javascript
const snapshot = await client.send('DOMSnapshot.captureSnapshot', {
  computedStyles: [
    'background-color', 'color', 'font-family', 'font-size', 'font-weight',
    'line-height', 'letter-spacing', 'text-align', 'text-decoration',
    'border-radius', 'border-color', 'border-width', 'border-style',
    'opacity', 'box-shadow', 'padding-top', 'padding-right', 'padding-bottom',
    'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
    'overflow', 'position', 'z-index', 'background-image', 'background-size',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'transform', 'text-transform'
  ],
  includePaintOrder: true,
  includeDOMRects: true
});
```

This returns: full DOM tree, bounding boxes, computed styles, paint order, text positions — ALL in one shot.

**B) Asset extraction** (runs via page.evaluate):
- Collects all `<img>` src URLs with dimensions
- Extracts CSS background-image URLs
- Extracts inline SVGs as raw SVG strings
- Captures font-face declarations

### Output: Design Tree JSON
```json
{
  "job_id": "studio_abc123",
  "viewport": { "width": 1440, "height": 900, "dpr": 3 },
  "page": { "title": "Starling Bank", "url": "https://starlingbank.com" },
  "nodes": [
    {
      "id": "n_0",
      "tag": "nav",
      "bounds": { "x": 0, "y": 0, "w": 1440, "h": 80 },
      "styles": {
        "backgroundColor": "rgb(255, 255, 255)",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "space-between",
        "paddingLeft": "32px",
        "paddingRight": "32px"
      },
      "children": ["n_1", "n_2", "n_3"],
      "paintOrder": 1,
      "semanticRole": null
    },
    {
      "id": "n_4",
      "tag": "span",
      "text": "Personal Banking",
      "bounds": { "x": 220, "y": 28, "w": 140, "h": 24 },
      "styles": {
        "fontFamily": "'Graphik', sans-serif",
        "fontSize": "16px",
        "fontWeight": "500",
        "color": "rgb(38, 38, 38)",
        "lineHeight": "24px"
      },
      "children": [],
      "paintOrder": 5
    }
  ],
  "assets": {
    "images": [
      { "id": "img_0", "src": "https://...", "width": 600, "height": 400, "usedBy": ["n_12"] }
    ],
    "svgs": [
      { "id": "svg_0", "markup": "<svg>...</svg>", "usedBy": ["n_7"] }
    ],
    "fonts": [
      { "family": "Graphik", "weight": "400", "src": "https://..." }
    ]
  },
  "designTokens": {
    "colors": ["#FFFFFF", "#262626", "#7B33E5", ...],
    "fontFamilies": ["Graphik", "Inter"],
    "fontSizes": ["14px", "16px", "20px", "32px", "48px"]
  }
}
```

### Open source foundations:
- CDP `DOMSnapshot.captureSnapshot` — the core API
- Patterns from `@builder.io/html-to-figma` — DOM-to-layer mapping logic
- `dembrandt` patterns — design token extraction

---

## 5. STAGE 3 — AI ENHANCEMENT (Phase 2)

**Location:** VPS backend
**Tech:** Claude Vision API (our own API call)

### What it does:
Takes the screenshot + design tree JSON and enhances it:
- **Semantic grouping** — identifies nav, hero, features, footer, CTA sections
- **Smart layer naming** — "Hero Section" not "div > div > div"
- **Component detection** — identifies cards, buttons, nav items, form fields
- **Auto-layout inference** — detects flex/grid patterns for Figma auto-layout

### This is Phase 2 — we build Stages 1, 2, 4 first.
The pipeline works without AI. AI makes the Figma output smarter, not more accurate.

---

## 6. STAGE 4 — FIGMA PLUGIN

**Location:** Figma Plugin (TypeScript, runs inside Figma)
**Tech:** create-figma-plugin framework + custom node creation

### What it does:
- User installs our "ReeveOS Studio" Figma plugin
- Plugin UI shows a text field for the job_id or a list of recent captures
- Plugin fetches the design tree JSON from our API
- Recursively creates Figma nodes from the tree:

```
JSON node (tag: "div", display: "flex") → figma.createFrame()
JSON node (tag: "span", text: "Hello")  → figma.createText()
JSON node (tag: "img")                  → figma.createRectangle() with image fill
JSON node (tag: "svg")                  → figma.createNodeFromSvg()
```

- Applies styles: fills, strokes, border-radius, shadows, opacity
- Sets auto-layout on flex containers
- Downloads and applies images as fills
- Loads and applies fonts (with fallbacks)
- Names layers semantically

### Node creation mapping:
| HTML/CSS | Figma Node | Notes |
|----------|-----------|-------|
| `<div>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<main>` | Frame | With auto-layout if display:flex/grid |
| `<span>`, `<p>`, `<h1>`-`<h6>`, `<a>`, `<label>` | Text | With font styles applied |
| `<img>` | Rectangle | With image fill (downloaded) |
| `<svg>` | Group (from SVG) | Via figma.createNodeFromSvg() |
| `<input>`, `<button>` | Frame + Text | Compound element |
| `<video>`, `<iframe>` | Rectangle | Placeholder with label |
| Background color | Fill | Solid or gradient |
| Border | Stroke | With radius |
| Box-shadow | Drop shadow effect | |
| Opacity | Node opacity | |

### Open source foundations:
- `create-figma-plugin` — plugin framework
- `sergcen/html-to-figma` — Figma-side node creation patterns
- Figma Plugin API docs — node types, properties

---

## 7. WHERE IT LIVES

### Backend (Rezvo.app repo):
```
backend/
  routes/
    studio.py          ← API endpoints
  services/
    studio_capture.py  ← Playwright capture engine
    studio_extract.py  ← DOM extraction + design tree builder
    studio_enhance.py  ← AI enhancement (Phase 2)
  static/
    studio/
      jobs/            ← Captured screenshots + JSON stored here
```

### Frontend (Rezvo.app repo):
```
frontend/src/
  pages/admin/
    Studio.jsx         ← Admin panel page — URL input, preview, job list
```

### Figma Plugin (NEW repo: Ambassadorbtc/reeveos-figma-plugin):
```
reeveos-figma-plugin/
  src/
    main.ts            ← Plugin logic — node creation
    ui.tsx             ← Plugin UI — job browser
  manifest.json
  package.json
```

---

## 8. BUILD ORDER

### Sprint 1: Capture Engine (Today)
1. Install Playwright + dependencies on this machine for testing
2. Build `studio_capture.py` — URL in, high-res screenshot out
3. Build cookie/popup dismissal layer
4. Build lazy-load scroll trigger
5. Test on hard sites: Starling Bank, Deliveroo, Uber Eats
6. Build `POST /api/studio/capture` endpoint

### Sprint 2: DOM Extraction (Next)
1. Build CDP DOMSnapshot integration
2. Build design tree JSON builder
3. Build asset collector (images, SVGs, fonts)
4. Build design token extractor (colors, fonts, sizes)
5. Test: capture + extract on same sites
6. Build `GET /api/studio/jobs/{id}/tree` endpoint

### Sprint 3: Studio UI
1. Build `Studio.jsx` admin page
2. URL input with viewport selector
3. Live progress indicators
4. Screenshot preview with zoom
5. Design tree inspector (optional, nice to have)
6. "Push to Figma" button (triggers plugin)

### Sprint 4: Figma Plugin
1. Scaffold plugin with create-figma-plugin
2. Build JSON-to-Figma node mapper
3. Handle text nodes with font loading
4. Handle images with download + fill
5. Handle SVGs
6. Handle auto-layout inference
7. Test: full pipeline end to end

### Sprint 5: AI Enhancement (Phase 2)
1. Claude Vision integration for semantic grouping
2. Smart layer naming
3. Component detection
4. Auto-layout optimization

---

## 9. API ENDPOINTS

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/studio/capture` | Start a capture job |
| GET | `/api/studio/jobs/{id}` | Job status + screenshot URL |
| GET | `/api/studio/jobs/{id}/tree` | Design tree JSON |
| GET | `/api/studio/jobs/{id}/assets/{asset_id}` | Download an extracted asset |
| GET | `/api/studio/jobs` | List all capture jobs |
| DELETE | `/api/studio/jobs/{id}` | Delete a job |

---

## 10. TECH DECISIONS

| Decision | Choice | Why |
|----------|--------|-----|
| Capture engine language | Python | Playwright-python is mature, matches existing FastAPI backend |
| Plugin framework | create-figma-plugin (TypeScript) | De facto standard, best DX |
| Cookie handling | autoconsent | DuckDuckGo-maintained, 100+ CMPs, Playwright integration |
| Bot evasion | playwright-stealth | Prevents sites serving different content to bots |
| Screenshot format | PNG | Lossless, required for pixel-perfect capture |
| Design tree format | Custom JSON | Optimised for Figma node mapping, not generic DOM |
| Asset storage | Local filesystem (VPS) | Simple, fast, no S3 needed yet |
| AI enhancement | Claude Vision API | We're already on Claude, best multimodal understanding |

---

## 11. KNOWN LIMITS & MITIGATIONS

| Limit | Mitigation |
|-------|-----------|
| Chromium max screenshot height: 16,384px | Section-by-section capture + stitch |
| Some sites block headless browsers | Stealth plugin + real user-agent |
| Web fonts may not match Figma fonts | Font mapping table + fallback system |
| Canvas-rendered content (WebGL, charts) | Captured as screenshot rectangles, not editable |
| Auth-protected pages | Future: cookie injection / session paste |
| Very large pages (100+ MB assets) | Timeout limits + progressive loading |

---

*Spec locked: 2 March 2026*
*Author: Claude + Ambassador*
*Status: APPROVED — Ready for Sprint 1*
