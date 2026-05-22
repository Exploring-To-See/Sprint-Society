#!/usr/bin/env python3
"""Render an HTML infographic to PNG via headless Chromium (Playwright).

Usage:
    python render_infographic.py infographic.html output.png [--width 1400] [--scale 2]

The HTML is rendered at a fixed viewport width; height expands to full page.
`--scale 2` doubles device pixel ratio for retina / presentation use.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path


async def render(html_path: Path, png_path: Path, width: int, scale: int,
                 wait_ms: int) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        sys.stderr.write(
            "Playwright is not installed. Run:\n"
            "  pip install playwright && playwright install chromium\n"
        )
        sys.exit(2)

    abs_html = html_path.resolve()
    if not abs_html.exists():
        sys.stderr.write(f"HTML not found: {abs_html}\n")
        sys.exit(1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": width, "height": 900},
            device_scale_factor=scale,
        )
        page = await context.new_page()
        await page.goto(abs_html.as_uri())
        # Let Tailwind CDN apply and any web fonts settle.
        await page.wait_for_load_state("networkidle")
        if wait_ms:
            await page.wait_for_timeout(wait_ms)
        await page.screenshot(path=str(png_path), full_page=True)
        await context.close()
        await browser.close()

    size = png_path.stat().st_size
    print(f"Saved: {png_path} ({size/1024:.1f} KB, viewport {width}x? @ {scale}x)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html", help="Input HTML file")
    parser.add_argument("png", help="Output PNG path")
    parser.add_argument("--width", type=int, default=1400,
                        help="Viewport width in CSS pixels (default 1400)")
    parser.add_argument("--scale", type=int, default=2,
                        help="Device pixel ratio (default 2 for retina)")
    parser.add_argument("--wait-ms", type=int, default=400,
                        help="Extra wait after load (default 400ms)")
    args = parser.parse_args()

    asyncio.run(render(
        Path(args.html), Path(args.png),
        width=args.width, scale=args.scale, wait_ms=args.wait_ms,
    ))


if __name__ == "__main__":
    main()
