---
name: ascii-to-infographic
description: Use when the user provides an ASCII or Unicode box-drawing diagram and wants a polished, styled PNG infographic — not a pixel-perfect text render. Triggers on phrases like "turn this into an infographic", "make a good-looking PNG from this diagram", "create an infographic from this ascii", "extract the concept and visualize", or when the user wants a modern card-based dashboard visual (architecture, pipeline, flow, hierarchy) derived from ASCII. For literal ASCII rendering, use ascii-to-png instead.
---

# ASCII Diagram to PNG Infographic

## Overview

Converts ASCII/Unicode diagrams into polished PNG infographics by extracting the concept semantically, rendering an HTML layout, and exporting via a headless browser.

**Core principle:** LLMs reliably extract semantics and generate HTML/CSS; browsers reliably handle layout. Delegate layout to CSS (flexbox/grid) — never hardcode X/Y coordinates.

**Pipeline:** `ASCII → Normalize → JSON IR → HTML (Tailwind) → Headless Chromium → PNG`

## When to Use

- User pastes a boxed diagram (business architecture, data pipeline, service flow, org chart) and wants a **visually polished** PNG.
- User says "infographic", "dashboard style", "nice-looking diagram", "presentation-ready".
- Output must have color coding, typography hierarchy, badges, shadows — not just rendered text.

**Do NOT use when:**
- User wants the ASCII rendered as-is, pixel-for-pixel → use `ascii-to-png`.
- Source is already a structured model (Mermaid, Graphviz, draw.io) → render that directly.
- User wants a raw flowchart with auto-layout only → use Mermaid via `mmdc`.

## Prerequisites

- Python 3.9+
- Playwright + Chromium: `pip install playwright && playwright install chromium`
- Internet access (Tailwind via CDN) OR pre-bundled Tailwind CSS

## Pipeline

### Step 1: Normalize Input

- Strip markdown code fences.
- Expand tabs to spaces (`text.expandtabs(8)`).
- Keep original alignment; do NOT reflow.
- Unify box-drawing charsets if mixed (Unicode `┌─┐` vs ASCII `+--+`).

Write the raw diagram to `diagram.txt` with `encoding="utf-8"` via Python — never through shell `echo`/`printf` (mangles box-drawing chars).

### Step 2: Semantic Extraction → JSON IR

Read the ASCII and produce a structured `diagram.ir.json`. Use this schema:

```json
{
  "title": "Inferred or user-provided",
  "diagram_type": "architecture | pipeline | sequence | hierarchy | flow",
  "layout": {
    "overall_direction": "top-to-bottom | left-to-right",
    "container_internal_directions": {"<id>": "left-to-right"},
    "vertical_ordering": ["<id>", "..."]
  },
  "containers": [
    {"id": "platform", "label": "IT Data Platform", "subtitle": "AWS",
     "children": ["bronze", "silver", "gold"],
     "description": ["Iceberg tables", "Glue engine"]}
  ],
  "nodes": [
    {"id": "bronze", "label": "Bronze", "subtitle": "Raw", "type": "stage"}
  ],
  "edges": [
    {"from": "business", "to": "platform",
     "label": "Publish (data + manifest)", "direction": "down"}
  ],
  "style": {"theme": "enterprise-dark", "palette": "slate"}
}
```

See `ir_schema.json` for the full schema. Node `type` values: `stage`, `consumer`, `system`, `actor`, `store`.

### Step 3: Confidence Check

Before rendering, summarize:

> "Detected N nodes, M containers, K directed flows. Inferred type: `<type>`. Continue?"

If containment is ambiguous, edges are multi-labeled, or fan-out is unclear, ask the user to confirm **before** rendering.

### Step 4: Generate HTML Infographic

Write a self-contained `infographic.html` using Tailwind via CDN. Use `template.html` in this skill folder as a reference starting point.

**Design rules (follow all):**

- **Layout:** CSS Grid or Flexbox only. No `position: absolute` coordinates.
- **Aesthetic:** dark slate-900 enterprise dashboard by default; offer light/editorial/blueprint as alternates.
- **Cards:** rounded (`rounded-2xl`), bordered, subtle shadow, interior padding ≥ 16px.
- **Color coding by semantic role:**
  - `business` / `actor` → blue (`sky-500`)
  - `platform` / `container` → slate / neutral
  - `stage` medallion → bronze `#CD7F32` / silver `#C0C0C0` / gold `#FFD700`
  - `consumer` / `target` → emerald or violet
- **Typography:** `font-semibold` titles, `text-xs uppercase tracking-wider` subtitles, `text-slate-400 italic` for annotations.
- **Directional indicators:** CSS arrows or small inline SVG — labeled clearly.
- **Technology tags:** pill badges (`rounded-full px-2 py-0.5 text-xs`).
- **Page:** ~1200px wide, `min-h-screen`, no horizontal scroll.
- **No AI slop:** avoid neon cyan+magenta, avoid Inter + violet gradient text. Pick one named palette and commit.

### Step 5: Render to PNG

Run the bundled script:

```bash
python ~/.claude/skills/ascii-to-infographic/render_infographic.py \
  infographic.html infographic.png --width 1400 --scale 2
```

High-DPI `--scale 2` is the default for presentation use.

### Step 6: Deliver + Offer Adjustments

Return `infographic.png` and offer:
- Theme (dark / light / blueprint / editorial)
- Dimensions (1200 / 1600 / 1920 wide)
- Detail level (executive summary vs. annotated technical)
- Alternate renderer (Mermaid for a fast draft; see Fallbacks)

## Quick Reference

| Step | Artifact | Produced by |
|------|----------|-------------|
| 1 | `diagram.txt` | Python file write (UTF-8) |
| 2 | `diagram.ir.json` | LLM semantic extraction |
| 3 | confirmation | You summarize to user |
| 4 | `infographic.html` | LLM generates Tailwind HTML |
| 5 | `infographic.png` | `render_infographic.py` (Playwright) |

## Fallback Renderers

When Playwright is unavailable or the user wants a fast draft:

1. **Mermaid via `mmdc`** — generate Mermaid `flowchart TD` / `graph LR` from the IR; fast but limited styling. Install: `npm i -g @mermaid-js/mermaid-cli`.
2. **Python `diagrams` library** — for AWS/GCP/Azure architectures with native icons. Install: `pip install diagrams` (requires Graphviz).
3. **Graphviz DOT** — emit DOT from the IR; render with `dot -Tpng`.
4. **Last resort:** fall through to the `ascii-to-png` skill for a pixel-perfect text render.

## Common Mistakes

- **Hardcoding coordinates.** Never generate `position: absolute; top: 120px`. Let flex/grid handle it.
- **Round-tripping ASCII through shell.** Box-drawing chars get mangled. Always write the diagram to a file via Python with `encoding="utf-8"`.
- **Skipping the IR.** Going ASCII → HTML directly produces inconsistent output. Always produce `diagram.ir.json` first — it makes the design re-renderable and testable.
- **Mixing direction declarations** inside Mermaid subgraphs — behavior is unpredictable. Prefer one `direction` per graph.
- **Treating fan-out junctions as single edges.** `Gold → {ADR, CDR, FinIQ}` is three edges in the IR.
- **Using emoji or decorative chars as node labels.** Keep labels textual; badges carry metadata.
- **Forgetting high-DPI.** Ship with `--scale 2` for anything that will be screenshotted or put in slides.

## Robustness Checklist

Before rendering, verify against the source ASCII:

- [ ] Every box in the ASCII appears as a node or container in the IR.
- [ ] Nested containment (boxes inside boxes) is preserved via `children`.
- [ ] Every arrow in the ASCII has a corresponding edge with `direction`.
- [ ] Bidirectional flows (publish down / consume up on the same line) are two edges.
- [ ] Labels on arrows survived into `edge.label`.
- [ ] Ownership notes, technology annotations end up as `description[]` or badges.

## Example IR from the Canonical Diagram

Input ASCII (Business/Dataiku → Bronze/Silver/Gold → ADR/CDR/FinIQ) extracts to:

- 2 containers: `business` (Dataiku), `platform` (AWS)
- 6 nodes: `bronze`, `silver`, `gold` (stages); `adr`, `cdr`, `finiq` (consumers)
- 6 edges: `business↔platform` (bidirectional pair), `bronze→silver→gold`, `gold→{adr,cdr,finiq}` (fan-out)
- Annotations: "Actuaries build ETL logic", "IT owns data models", "Iceberg + Glue"

This IR renders to a 3-row infographic: business card on top, platform card with three medallion stages in the middle, three consumer cards fanning out at the bottom.

## Environment Setup

```bash
pip install playwright
playwright install chromium
# optional fallbacks:
npm install -g @mermaid-js/mermaid-cli   # Mermaid
pip install diagrams                      # needs Graphviz on PATH
```
