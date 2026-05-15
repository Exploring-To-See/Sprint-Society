"""
Kendu Studio — Graphics Agent
Creates branded text overlays, stat cards, lower-thirds, and motion graphics.
Uses Pillow for static frames, MoviePy for animated overlays.
"""

import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from brand import COLORS, FONTS, FONT_FILES, PLATFORM_SPECS, BRAND_RULES, hex_to_rgb, hex_to_rgba

STUDIO_ROOT = Path(__file__).parent.parent
FONTS_DIR = STUDIO_ROOT / "assets" / "fonts"
OVERLAYS_DIR = STUDIO_ROOT / "assets" / "overlays"


def _get_font(font_key: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a brand font. Falls back to default if not found."""
    font_file = FONTS_DIR / FONT_FILES.get(font_key, "Inter-Regular.ttf")
    if font_file.exists():
        return ImageFont.truetype(str(font_file), size)
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def create_text_overlay(
    text: str,
    width: int = 1080,
    height: int = 1920,
    font_key: str = "heading",
    font_size: int = 80,
    text_color: str = "#FFFFFF",
    glow_color: Optional[str] = None,
    glow_radius: int = 20,
    position: str = "center",
    bg_opacity: int = 0,
) -> Image.Image:
    """
    Create a transparent text overlay frame.
    Can be composited onto video frames.
    """
    img = Image.new("RGBA", (width, height), (0, 0, 0, bg_opacity))
    draw = ImageDraw.Draw(img)
    font = _get_font(font_key, font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    if position == "center":
        x = (width - text_w) // 2
        y = (height - text_h) // 2
    elif position == "top":
        x = (width - text_w) // 2
        y = int(height * 0.15)
    elif position == "bottom":
        x = (width - text_w) // 2
        y = int(height * 0.75)
    else:
        x = (width - text_w) // 2
        y = (height - text_h) // 2

    if glow_color:
        glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_rgb = hex_to_rgba(glow_color, 180)
        glow_draw.text((x, y), text, font=font, fill=glow_rgb)
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
        img = Image.alpha_composite(img, glow_layer)
        draw = ImageDraw.Draw(img)

    color_rgba = hex_to_rgba(text_color)
    draw.text((x, y), text, font=font, fill=color_rgba)

    return img


def create_title_slam(
    line1: str,
    line2: str,
    width: int = 1080,
    height: int = 1920,
    line1_color: str = None,
    line2_color: str = "#FFFFFF",
    glow: bool = True,
) -> Image.Image:
    """Create the 'SPRINT / SOCIETY' style two-line title."""
    if line1_color is None:
        line1_color = COLORS["accent_orange"]

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))

    overlay1 = create_text_overlay(
        line1, width, height,
        font_key="heading", font_size=100,
        text_color=line1_color,
        glow_color=line1_color if glow else None,
        glow_radius=25,
        position="center",
    )

    overlay2 = create_text_overlay(
        line2, width, height,
        font_key="heading", font_size=100,
        text_color=line2_color,
        glow_color=line2_color if glow else None,
        glow_radius=15,
        position="center",
    )

    draw2 = ImageDraw.Draw(overlay2)
    font = _get_font("heading", 100)
    bbox = draw2.textbbox((0, 0), line2, font=font)
    shift = 60

    shifted = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    shifted.paste(overlay2, (0, shift), overlay2)

    img = Image.alpha_composite(img, overlay1)
    img = Image.alpha_composite(img, shifted)

    return img


def create_lower_third(
    name: str,
    subtitle: str = "",
    width: int = 1080,
    height: int = 1920,
    accent_color: str = None,
) -> Image.Image:
    """Create a branded lower-third name tag overlay."""
    if accent_color is None:
        accent_color = COLORS["accent_orange"]

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    bar_y = int(height * 0.78)
    bar_h = 80 if subtitle else 60
    margin = int(width * 0.08)

    draw.rectangle(
        [(margin, bar_y), (width - margin, bar_y + bar_h)],
        fill=(10, 10, 15, 200),
    )

    accent_rgb = hex_to_rgba(accent_color)
    draw.rectangle(
        [(margin, bar_y), (margin + 4, bar_y + bar_h)],
        fill=accent_rgb,
    )

    name_font = _get_font("heading", 32)
    draw.text((margin + 20, bar_y + 12), name, font=name_font, fill=(255, 255, 255, 255))

    if subtitle:
        sub_font = _get_font("body", 20)
        draw.text((margin + 20, bar_y + 48), subtitle, font=sub_font, fill=hex_to_rgba(COLORS["text_secondary"]))

    return img


def create_stat_card(
    stats: dict[str, str],
    width: int = 1080,
    height: int = 1920,
    title: str = "",
    style: str = "glass",
) -> Image.Image:
    """
    Create a stat card overlay (glass-card style).
    stats: {"Distance": "5.2 km", "Pace": "5:32/km", "Duration": "28:45"}
    """
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_w = int(width * 0.85)
    card_h = 80 + len(stats) * 70
    card_x = (width - card_w) // 2
    card_y = (height - card_h) // 2

    if style == "glass":
        draw.rounded_rectangle(
            [(card_x, card_y), (card_x + card_w, card_y + card_h)],
            radius=20,
            fill=(18, 18, 26, 200),
            outline=hex_to_rgba(COLORS["accent_orange"], 100),
            width=1,
        )

    if title:
        title_font = _get_font("heading", 28)
        draw.text(
            (card_x + 30, card_y + 20),
            title.upper(),
            font=title_font,
            fill=hex_to_rgba(COLORS["accent_orange"]),
        )

    y_offset = card_y + (70 if title else 30)
    label_font = _get_font("body", 20)
    value_font = _get_font("stats", 36)

    for label, value in stats.items():
        draw.text(
            (card_x + 30, y_offset),
            label.upper(),
            font=label_font,
            fill=hex_to_rgba(COLORS["text_muted"]),
        )
        draw.text(
            (card_x + 30, y_offset + 24),
            value,
            font=value_font,
            fill=(255, 255, 255, 255),
        )
        y_offset += 70

    return img


def create_end_card(
    text: str = "COMING SOON",
    width: int = 1080,
    height: int = 1920,
    accent_color: str = None,
) -> Image.Image:
    """Create a branded end card with CTA text."""
    if accent_color is None:
        accent_color = COLORS["accent_red"]

    bg_rgb = hex_to_rgb(COLORS["bg_primary"])
    img = Image.new("RGBA", (width, height), (*bg_rgb, 255))
    draw = ImageDraw.Draw(img)

    title = create_title_slam("SPRINT", "SOCIETY", width, height)
    img = Image.alpha_composite(img, title)
    draw = ImageDraw.Draw(img)

    cta_font = _get_font("heading", 52)
    bbox = draw.textbbox((0, 0), text, font=cta_font)
    cta_w = bbox[2] - bbox[0]
    cta_x = (width - cta_w) // 2
    cta_y = int(height * 0.65)

    glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.text((cta_x, cta_y), text, font=cta_font, fill=hex_to_rgba(accent_color, 150))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))
    img = Image.alpha_composite(img, glow_layer)

    draw = ImageDraw.Draw(img)
    draw.text((cta_x, cta_y), text, font=cta_font, fill=hex_to_rgba(accent_color))

    footer_font = _get_font("body", 14)
    footer_text = BRAND_RULES["footer_text"].upper()
    bbox = draw.textbbox((0, 0), footer_text, font=footer_font)
    footer_w = bbox[2] - bbox[0]
    draw.text(
        ((width - footer_w) // 2, height - 80),
        footer_text,
        font=footer_font,
        fill=hex_to_rgba(COLORS["text_muted"]),
    )

    return img


def create_dark_background(
    width: int = 1080,
    height: int = 1920,
) -> Image.Image:
    """Create a radial gradient dark background."""
    img = Image.new("RGB", (width, height), hex_to_rgb(COLORS["bg_primary"]))
    draw = ImageDraw.Draw(img)

    center_x, center_y = width // 2, int(height * 0.35)
    tertiary = hex_to_rgb(COLORS["bg_tertiary"])
    primary = hex_to_rgb(COLORS["bg_primary"])

    for r in range(min(width, height) // 2, 0, -2):
        ratio = r / (min(width, height) // 2)
        color = tuple(int(tertiary[i] * ratio + primary[i] * (1 - ratio)) for i in range(3))
        draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=color,
        )

    return img


if __name__ == "__main__":
    print("=" * 50)
    print("KENDU STUDIO — Graphics Agent")
    print("=" * 50)

    os.makedirs(OVERLAYS_DIR, exist_ok=True)

    print("\nGenerating sample overlays...")

    title = create_title_slam("SPRINT", "SOCIETY")
    title.save(str(OVERLAYS_DIR / "title_slam_sample.png"))
    print("  Created: title_slam_sample.png")

    end = create_end_card("COMING SOON")
    end.save(str(OVERLAYS_DIR / "end_card_sample.png"))
    print("  Created: end_card_sample.png")

    lower = create_lower_third("KENDU", "Run Leader")
    lower.save(str(OVERLAYS_DIR / "lower_third_sample.png"))
    print("  Created: lower_third_sample.png")

    stats = create_stat_card(
        {"Distance": "5.2 km", "Avg Pace": "5:32/km", "Duration": "28:45", "Runners": "20"},
        title="Demo Run Stats"
    )
    stats.save(str(OVERLAYS_DIR / "stat_card_sample.png"))
    print("  Created: stat_card_sample.png")

    print(f"\nAll overlays saved to: {OVERLAYS_DIR}")
