"""
Kendu Studio — Launch Trailer
Full 45-second trailer for Sprint Society.
Renders using existing footage + programmatic text/graphics scenes.

Usage:
    cd sprint-society
    python studio/projects/launch-trailer/render_trailer.py
"""

import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(os.getcwd())
STUDIO_ROOT = PROJECT_ROOT / "studio"
sys.path.insert(0, str(STUDIO_ROOT))

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from moviepy import (
    VideoFileClip,
    ImageClip,
    ColorClip,
    CompositeVideoClip,
    concatenate_videoclips,
    vfx,
)

from brand import COLORS, FONTS, FONT_FILES, hex_to_rgb

# ── Config ──
OUTPUT_DIR = STUDIO_ROOT / "output"
CLIPS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "clips"
PHOTOS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "photos"
FONTS_DIR = STUDIO_ROOT / "assets" / "fonts"

WIDTH, HEIGHT = 1080, 1920
FPS = 30
BG_COLOR = hex_to_rgb(COLORS["bg_primary"])


def get_font(style="heading", size=90):
    font_path = str(FONTS_DIR / FONT_FILES[style])
    try:
        return ImageFont.truetype(font_path, size)
    except:
        try:
            return ImageFont.truetype("arial.ttf", size)
        except:
            return ImageFont.load_default()


def fit_clip(clip, target_w=WIDTH, target_h=HEIGHT):
    clip_w, clip_h = clip.size
    target_ratio = target_w / target_h
    clip_ratio = clip_w / clip_h
    if clip_ratio > target_ratio:
        new_h = target_h
        new_w = int(clip_w * (target_h / clip_h))
    else:
        new_w = target_w
        new_h = int(clip_h * (target_w / clip_w))
    clip = clip.resized((new_w, new_h))
    x_off = (new_w - target_w) // 2
    y_off = (new_h - target_h) // 2
    clip = clip.cropped(x1=x_off, y1=y_off, x2=x_off + target_w, y2=y_off + target_h)
    return clip


def color_grade_cinematic(frame):
    graded = frame.astype(np.float32)
    graded *= 0.8
    graded[:, :, 0] += 12
    graded[:, :, 1] += 3
    contrast = 1.18
    graded = (graded - 128) * contrast + 128
    return np.clip(graded, 0, 255).astype(np.uint8)


def add_vignette(frame):
    h, w = frame.shape[:2]
    Y, X = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    radius = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    max_r = np.sqrt(cx**2 + cy**2)
    vignette = 1.0 - np.clip((radius / max_r - 0.4) / 0.6, 0, 1) * 0.65
    result = frame.astype(np.float32) * vignette[:, :, np.newaxis]
    return np.clip(result, 0, 255).astype(np.uint8)


def create_text_scene(
    text,
    font_size=72,
    color="#FFFFFF",
    glow_color=None,
    subtitle=None,
    sub_size=28,
    sub_color="#B0B0C0",
    duration=3.0,
    bg_color=None,
):
    bg = bg_color or BG_COLOR
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    font = get_font("heading", font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (WIDTH - text_w) // 2
    y = (HEIGHT - text_h) // 2 - 60

    if glow_color:
        glow_img = Image.new("RGB", (WIDTH, HEIGHT), bg)
        glow_draw = ImageDraw.Draw(glow_img)
        glow_draw.text((x, y), text, font=font, fill=hex_to_rgb(glow_color))
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=25))
        img = Image.blend(img, glow_img, 0.5)
        draw = ImageDraw.Draw(img)

    draw.text((x, y), text, font=font, fill=hex_to_rgb(color))

    if subtitle:
        sub_font = get_font("body", sub_size)
        sub_bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = (WIDTH - sub_w) // 2
        sub_y = y + text_h + 70
        draw.text((sub_x, sub_y), subtitle, font=sub_font, fill=hex_to_rgb(sub_color))

    frame_array = np.array(img)
    clip = ImageClip(frame_array).with_duration(duration).with_fps(FPS)
    return clip


def create_stats_scene(duration=4.0):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    heading_font = get_font("heading", 48)
    mono_font = get_font("stats", 72)
    body_font = get_font("body", 24)
    small_font = get_font("body", 20)

    center_y = HEIGHT // 2 - 100

    draw.text((200, center_y - 80), "WEEK 1", font=small_font, fill=hex_to_rgb(COLORS["text_muted"]))
    draw.text((165, center_y - 30), "6:45", font=mono_font, fill=hex_to_rgb(COLORS["text_muted"]))
    draw.text((210, center_y + 50), "/km", font=small_font, fill=hex_to_rgb(COLORS["text_muted"]))

    draw.text((WIDTH // 2 - 20, center_y), "→", font=heading_font, fill=hex_to_rgb(COLORS["accent_orange"]))

    draw.text((680, center_y - 80), "WEEK 8", font=small_font, fill=hex_to_rgb(COLORS["accent_green"]))
    draw.text((645, center_y - 30), "5:10", font=mono_font, fill=hex_to_rgb(COLORS["accent_green"]))
    draw.text((690, center_y + 50), "/km", font=small_font, fill=hex_to_rgb(COLORS["accent_green"]))

    subtitle = "See your pace drop. Feel the difference."
    sub_bbox = draw.textbbox((0, 0), subtitle, font=body_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((WIDTH - sub_w) // 2, center_y + 160), subtitle, font=body_font, fill=hex_to_rgb(COLORS["text_secondary"]))

    bar_y = center_y + 220
    bar_w = int(WIDTH * 0.6)
    bar_x = (WIDTH - bar_w) // 2
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 10], radius=5, fill=(30, 30, 50))
    fill_w = int(bar_w * 0.78)
    draw.rounded_rectangle([bar_x, bar_y, bar_x + fill_w, bar_y + 10], radius=5, fill=hex_to_rgb(COLORS["accent_green"]))

    return ImageClip(np.array(img)).with_duration(duration).with_fps(FPS)


def create_features_scene(duration=4.0):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    heading_font = get_font("heading", 52)
    body_font = get_font("body", 30)

    title = "AI-POWERED COACHING"
    title_bbox = draw.textbbox((0, 0), title, font=heading_font)
    title_w = title_bbox[2] - title_bbox[0]
    tx = (WIDTH - title_w) // 2
    ty = HEIGHT // 2 - 200

    glow_img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.text((tx, ty), title, font=heading_font, fill=hex_to_rgb(COLORS["accent_orange"]))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=18))
    img = Image.blend(img, glow_img, 0.4)
    draw = ImageDraw.Draw(img)
    draw.text((tx, ty), title, font=heading_font, fill=hex_to_rgb(COLORS["accent_orange"]))

    features = [
        "● Personalized pace zones",
        "● Weekly challenges",
        "● Real-time progress tracking",
    ]
    for i, feat in enumerate(features):
        fy = ty + 120 + i * 60
        draw.text((WIDTH // 2 - 200, fy), feat, font=body_font, fill=hex_to_rgb(COLORS["text_primary"]))

    card_x, card_y = WIDTH // 2 - 260, ty + 340
    card_w, card_h = 520, 200
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=20,
        fill=(255, 255, 255, 10),
        outline=(255, 255, 255, 20),
    )
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    img = img.convert("RGB")

    return ImageClip(np.array(img)).with_duration(duration).with_fps(FPS)


def create_gamification_scene(duration=4.0):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    heading_font = get_font("heading", 44)
    mono_font = get_font("stats", 28)
    small_font = get_font("body", 16)

    cx, cy = WIDTH // 2, HEIGHT // 2 - 80
    gold = hex_to_rgb(COLORS["accent_gold"])
    for r in [90, 110, 130]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*gold, 60) if r > 90 else gold, width=2)

    draw.text((cx - 50, cy - 30), "TIER UP", font=small_font, fill=gold)
    tier_font = get_font("heading", 36)
    draw.text((cx - 35, cy + 0), "INT", font=tier_font, fill=(255, 255, 255))

    title = "Level up every run."
    title_bbox = draw.textbbox((0, 0), title, font=heading_font)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((WIDTH - title_w) // 2, cy + 180), title, font=heading_font, fill=gold)

    bar_y = cy + 260
    bar_w = int(WIDTH * 0.5)
    bar_x = (WIDTH - bar_w) // 2
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 10], radius=5, fill=(30, 30, 50))
    fill_w = int(bar_w * 0.85)
    draw.rounded_rectangle([bar_x, bar_y, bar_x + fill_w, bar_y + 10], radius=5, fill=gold)

    xp_text = "2,400 / 3,000 XP"
    xp_bbox = draw.textbbox((0, 0), xp_text, font=mono_font)
    xp_w = xp_bbox[2] - xp_bbox[0]
    draw.text(((WIDTH - xp_w) // 2, bar_y + 20), xp_text, font=mono_font, fill=hex_to_rgb(COLORS["text_muted"]))

    return ImageClip(np.array(img)).with_duration(duration).with_fps(FPS)


def create_run_card_scene(duration=3.0):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    card_w, card_h = 500, 380
    card_x = (WIDTH - card_w) // 2
    card_y = (HEIGHT - card_h) // 2 - 80

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=24,
        fill=(255, 255, 255, 10),
        outline=(255, 255, 255, 20),
    )
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)

    small_font = get_font("body", 16)
    mono_font = get_font("stats", 48)
    label_font = get_font("body", 14)
    heading_font = get_font("heading", 40)

    draw.text((card_x + 30, card_y + 25), "RUN RECAP", font=small_font, fill=hex_to_rgb(COLORS["text_muted"]))
    draw.text((card_x + 30, card_y + 50), "May 14, 2026", font=small_font, fill=hex_to_rgb(COLORS["text_secondary"]))

    col_w = card_w // 3
    row_y = card_y + 110
    stats = [
        ("7.5", "km", COLORS["text_primary"]),
        ("5:06", "/km", COLORS["accent_green"]),
        ("200", "XP", COLORS["accent_orange"]),
    ]
    for i, (val, label, color) in enumerate(stats):
        sx = card_x + 30 + i * col_w
        draw.text((sx, row_y), val, font=mono_font, fill=hex_to_rgb(color))
        draw.text((sx + 5, row_y + 55), label, font=label_font, fill=hex_to_rgb(COLORS["text_muted"]))

    draw.line(
        [card_x + 30, card_y + card_h - 60, card_x + card_w - 30, card_y + card_h - 60],
        fill=(255, 255, 255, 15),
        width=1,
    )
    brand_font = get_font("body", 14)
    draw.text(
        (card_x + 30, card_y + card_h - 40),
        "SPRINT SOCIETY",
        font=brand_font,
        fill=hex_to_rgb(COLORS["accent_orange"]),
    )

    subtitle = "Flex your progress."
    sub_font = get_font("heading", 34)
    sub_bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((WIDTH - sub_w) // 2, card_y + card_h + 60), subtitle, font=sub_font, fill=(255, 255, 255))

    return ImageClip(np.array(img)).with_duration(duration).with_fps(FPS)


def create_flash(duration=0.07):
    flash = ColorClip(size=(WIDTH, HEIGHT), color=(255, 255, 255))
    flash = flash.with_duration(duration).with_fps(FPS)
    return flash.with_effects([vfx.FadeOut(duration * 0.8)])


def build_trailer():
    print("=" * 60)
    print("  KENDU STUDIO — Sprint Society Launch Trailer")
    print("  45s | 1080x1920 | 30fps")
    print("=" * 60)
    print()

    segments = []

    # ═══ ACT 1: THE HOOK (0-8s) ═══
    print("  ACT 1: THE HOOK")

    # Scene 1: "You run." (3s)
    print("    [1/15] 'You run.' text slam...")
    scene1 = create_text_scene("You run.", font_size=78, duration=3.0, glow_color="#FFFFFF")
    scene1 = scene1.with_effects([vfx.FadeIn(0.3)])
    segments.append(scene1)

    # Scene 2: "But are you improving?" (3s)
    print("    [2/15] 'But are you improving?' ...")
    scene2 = create_text_scene(
        "But are you improving?",
        font_size=42,
        color=COLORS["text_secondary"],
        duration=3.0,
    )
    scene2 = scene2.with_effects([vfx.FadeIn(0.2)])
    segments.append(scene2)

    # Scene 3: Quick cuts — stagnation (2s)
    print("    [3/15] Stagnation montage...")
    stag1 = create_text_scene("NO PROGRESS", font_size=32, color=COLORS["text_muted"], duration=0.6)
    segments.append(stag1)
    segments.append(create_flash())
    stag2 = create_text_scene(
        "pace: flat\ndistance: flat",
        font_size=24,
        color=COLORS["text_muted"],
        duration=0.6,
    )
    segments.append(stag2)
    segments.append(create_flash())
    stag3 = ColorClip(size=(WIDTH, HEIGHT), color=BG_COLOR).with_duration(0.5).with_fps(FPS)
    segments.append(stag3)

    # ═══ ACT 2: THE COMMUNITY (8-20s) ═══
    print("\n  ACT 2: THE COMMUNITY")

    # Scene 4: Arch walk + text (3s)
    print("    [4/15] Arch walk (cinematic)...")
    arch_clip = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-23-10-23-24.mp4"))
    arch = arch_clip.subclipped(10, 13)
    arch = fit_clip(arch)
    arch = arch.image_transform(color_grade_cinematic)
    arch = arch.image_transform(add_vignette)
    segments.append(arch)

    # Flash transition
    segments.append(create_flash())

    # Scene 5: Cold plunge energy (2s)
    print("    [5/15] Cold plunge energy...")
    plunge = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-39.mp4"))
    shock = plunge.subclipped(2, 3)
    shock = fit_clip(shock)
    shock = shock.image_transform(color_grade_cinematic)
    segments.append(shock)

    topdown = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-53-25.mp4"))
    submerge = topdown.subclipped(1, 2)
    submerge = fit_clip(submerge)
    submerge = submerge.image_transform(color_grade_cinematic)
    segments.append(submerge)

    # Scene 6: Group photo (2s)
    print("    [6/15] Group photo reveal...")
    group_img = Image.open(str(PHOTOS_DIR / "PHOTO-2025-07-09-11-25-15.jpg")).convert("RGB")
    group_array = np.array(group_img)
    group_clip = ImageClip(group_array).with_duration(2.0).with_fps(FPS)
    group_clip = fit_clip(group_clip)
    group_clip = group_clip.resized(lambda t: 1 + 0.02 * t)
    group_clip = group_clip.with_effects([vfx.FadeIn(0.2), vfx.FadeOut(0.2)])
    segments.append(group_clip)

    # Scene 7: Leader speaking (2s)
    print("    [7/15] Leader addressing group...")
    leader = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-55-34.mp4"))
    leader_shot = leader.subclipped(3, 5)
    leader_shot = fit_clip(leader_shot)
    leader_shot = leader_shot.image_transform(color_grade_cinematic)
    leader_shot = leader_shot.image_transform(add_vignette)
    segments.append(leader_shot)

    # Scene 8: More community footage (3s)
    print("    [8/15] Training footage...")
    fit_guy = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-00.mp4"))
    training = fit_guy.subclipped(3, 6)
    training = fit_clip(training)
    training = training.image_transform(color_grade_cinematic)
    training = training.image_transform(add_vignette)
    segments.append(training)

    # ═══ ACT 3: THE APP (20-35s) ═══
    print("\n  ACT 3: THE APP")

    segments.append(create_flash())

    # Scene 9: Features reveal (4s)
    print("    [9/15] AI-Powered Coaching features...")
    segments.append(create_features_scene(duration=4.0))

    # Scene 10: Transformation stats (4s)
    print("    [10/15] Transformation stats...")
    segments.append(create_stats_scene(duration=4.0))

    # Scene 11: Gamification (4s)
    print("    [11/15] Gamification — level up...")
    segments.append(create_gamification_scene(duration=4.0))

    # Scene 12: Run card (3s)
    print("    [12/15] Shareable run card...")
    segments.append(create_run_card_scene(duration=3.0))

    # ═══ ACT 4: THE CLOSE (35-45s) ═══
    print("\n  ACT 4: THE CLOSE")

    # Scene 13: Title slam (5s)
    print("    [13/15] SPRINT SOCIETY title slam...")
    title = create_text_scene(
        "SPRINT\nSOCIETY",
        font_size=95,
        color="#FFFFFF",
        glow_color=COLORS["accent_orange"],
        subtitle="For the runners, by the runners.",
        sub_size=26,
        duration=5.0,
    )
    title = title.with_effects([vfx.FadeIn(0.15)])
    segments.append(title)

    # Scene 14: CTA (3s)
    print("    [14/15] JOIN THE WAITLIST CTA...")
    cta = create_text_scene(
        "JOIN THE WAITLIST",
        font_size=58,
        color=COLORS["accent_red"],
        glow_color=COLORS["accent_red"],
        subtitle="sprintsociety.run",
        sub_size=30,
        sub_color=COLORS["accent_blue"],
        duration=3.0,
    )
    cta = cta.with_effects([vfx.FadeIn(0.2), vfx.FadeOut(0.4)])
    segments.append(cta)

    # Scene 15: Kendu Entertainment (2s)
    print("    [15/15] Kendu Entertainment logo...")
    kendu = create_text_scene(
        "Kendu Entertainment",
        font_size=14,
        color=COLORS["text_muted"],
        duration=2.0,
    )
    kendu = kendu.with_effects([vfx.FadeIn(0.5), vfx.FadeOut(0.5)])
    segments.append(kendu)

    # ═══ ASSEMBLE ═══
    print("\n  Assembling final timeline...")
    final = concatenate_videoclips(segments, method="compose")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(OUTPUT_DIR / "launch_trailer_v1.mp4")

    print(f"\n  Rendering to: {output_path}")
    print(f"  Duration: {final.duration:.1f}s | Resolution: {WIDTH}x{HEIGHT} | FPS: {FPS}")
    print()

    final.write_videofile(
        output_path,
        codec="libx264",
        fps=FPS,
        preset="medium",
        bitrate="10M",
        audio=False,
    )

    # Cleanup
    arch_clip.close()
    plunge.close()
    topdown.close()
    leader.close()
    fit_guy.close()

    print(f"\n  {'=' * 60}")
    print(f"  DONE! Output: {output_path}")
    print(f"  Duration: {final.duration:.1f}s")
    print(f"  {'=' * 60}")
    print(f"\n  NEXT STEPS:")
    print(f"  1. Add music in CapCut or DaVinci Resolve")
    print(f"  2. Generate AI clips from AI-GENERATION-PROMPTS.md")
    print(f"  3. Replace placeholder scenes with AI footage")
    print(f"  4. Re-render final version")
    return output_path


if __name__ == "__main__":
    build_trailer()
