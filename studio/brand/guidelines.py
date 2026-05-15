"""
Kendu Studio — Sprint Society Brand Guidelines
All visual decisions reference this module.
"""

COLORS = {
    "bg_primary": "#0A0A0F",
    "bg_secondary": "#12121A",
    "bg_tertiary": "#1A1A2E",
    "accent_orange": "#FF4D00",
    "accent_red": "#FF1744",
    "accent_ember": "#FF6B35",
    "accent_green": "#39FF14",
    "accent_blue": "#00D4FF",
    "accent_gold": "#FFD700",
    "text_primary": "#FFFFFF",
    "text_secondary": "#B0B0C0",
    "text_muted": "#6B6B80",
}

TIER_COLORS = {
    "beginner": "#39FF14",
    "intermediate": "#00D4FF",
    "advanced": "#FFD700",
}

FONTS = {
    "heading": "SpaceGrotesk-Bold",
    "body": "Inter-Regular",
    "stats": "JetBrainsMono-Regular",
}

FONT_FILES = {
    "heading": "SpaceGrotesk-Bold.ttf",
    "body": "Inter-Regular.ttf",
    "stats": "JetBrainsMono-Regular.ttf",
}

PLATFORM_SPECS = {
    "story": {"width": 1080, "height": 1920, "max_duration": 15, "fps": 30},
    "reel": {"width": 1080, "height": 1920, "max_duration": 90, "fps": 30},
    "square": {"width": 1080, "height": 1080, "max_duration": 60, "fps": 30},
    "landscape": {"width": 1920, "height": 1080, "max_duration": 60, "fps": 30},
}

STYLE_PROFILES = {
    "hype": {
        "primary_color": COLORS["accent_orange"],
        "secondary_color": COLORS["accent_red"],
        "transition_speed": "fast",
        "cut_duration_range": (0.3, 0.8),
        "text_animation": "slam",
        "energy": "high",
    },
    "cinematic": {
        "primary_color": COLORS["accent_ember"],
        "secondary_color": COLORS["text_secondary"],
        "transition_speed": "slow",
        "cut_duration_range": (1.5, 3.0),
        "text_animation": "fade",
        "energy": "medium",
    },
    "clean": {
        "primary_color": COLORS["text_primary"],
        "secondary_color": COLORS["accent_blue"],
        "transition_speed": "medium",
        "cut_duration_range": (1.0, 2.0),
        "text_animation": "slide",
        "energy": "low",
    },
    "celebratory": {
        "primary_color": COLORS["accent_gold"],
        "secondary_color": COLORS["accent_green"],
        "transition_speed": "medium",
        "cut_duration_range": (0.8, 1.5),
        "text_animation": "bounce",
        "energy": "high",
    },
}

BRAND_RULES = {
    "always_dark_background": True,
    "logo_text": "SPRINT SOCIETY",
    "footer_text": "Kendu Entertainment",
    "logo_position": "bottom_center",
    "watermark_opacity": 0.4,
    "min_text_size_story": 48,
    "min_text_size_square": 36,
    "text_safe_margin_percent": 10,
    "max_consecutive_cuts_without_breath": 6,
}


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def hex_to_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    r, g, b = hex_to_rgb(hex_color)
    return (r, g, b, alpha)
