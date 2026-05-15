"""
Kendu Studio — Teaser Reel 1: "The Mystery Teaser"
Assembles the Coming Soon hype teaser from real footage + generated overlays.
"""

import sys
import os
from pathlib import Path

# Use working directory as project root (run from sprint-society/)
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

from brand import COLORS, FONTS, FONT_FILES, PLATFORM_SPECS, hex_to_rgb

# Config
OUTPUT_DIR = STUDIO_ROOT / "output"
CLIPS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "clips"
PHOTOS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "photos"
FONTS_DIR = STUDIO_ROOT / "assets" / "fonts"
OVERLAYS_DIR = STUDIO_ROOT / "assets" / "overlays"

WIDTH, HEIGHT = 1080, 1920
FPS = 30


def fit_clip(clip, target_w=WIDTH, target_h=HEIGHT):
    """Resize + crop to cover target dimensions."""
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


def color_grade_orange(frame):
    """Apply dark orange tint for the hype look."""
    graded = frame.astype(np.float32)
    graded *= 0.8
    graded[:, :, 0] += 15  # slight red boost
    graded[:, :, 1] += 5
    contrast = 1.15
    graded = ((graded - 128) * contrast + 128)
    return np.clip(graded, 0, 255).astype(np.uint8)


def create_text_frame(
    text, font_size=90, color="#FFFFFF", glow_color=None,
    subtitle=None, sub_size=28, sub_color="#B0B0C0",
    duration=2.5
):
    """Create a text overlay clip on dark background."""
    bg_rgb = hex_to_rgb(COLORS["bg_primary"])
    img = Image.new("RGB", (WIDTH, HEIGHT), bg_rgb)
    draw = ImageDraw.Draw(img)

    font_path = str(FONTS_DIR / FONT_FILES["heading"])
    try:
        font = ImageFont.truetype(font_path, font_size)
    except:
        font = ImageFont.truetype("arial.ttf", font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (WIDTH - text_w) // 2
    y = (HEIGHT - text_h) // 2 - 40

    if glow_color:
        glow_img = Image.new("RGB", (WIDTH, HEIGHT), bg_rgb)
        glow_draw = ImageDraw.Draw(glow_img)
        glow_rgb = hex_to_rgb(glow_color)
        glow_draw.text((x, y), text, font=font, fill=glow_rgb)
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=20))
        img = Image.blend(img, glow_img, 0.6)
        draw = ImageDraw.Draw(img)

    text_rgb = hex_to_rgb(color)
    draw.text((x, y), text, font=font, fill=text_rgb)

    if subtitle:
        try:
            sub_font = ImageFont.truetype(str(FONTS_DIR / FONT_FILES["body"]), sub_size)
        except:
            sub_font = ImageFont.truetype("arial.ttf", sub_size)
        sub_bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = (WIDTH - sub_w) // 2
        sub_y = y + text_h + 60
        sub_rgb = hex_to_rgb(sub_color)
        draw.text((sub_x, sub_y), subtitle, font=sub_font, fill=sub_rgb)

    frame_array = np.array(img)
    clip = ImageClip(frame_array).with_duration(duration).with_fps(FPS)
    return clip


def create_flash_frame(duration=0.07):
    """Create a white flash transition frame."""
    flash = ColorClip(size=(WIDTH, HEIGHT), color=(255, 255, 255)).with_duration(duration).with_fps(FPS)
    return flash.with_effects([vfx.FadeOut(duration * 0.8)])


def build_teaser():
    """Assemble the Mystery Teaser."""
    print("=" * 50)
    print("KENDU STUDIO — Building Mystery Teaser")
    print("=" * 50)
    print()

    segments = []

    # Shot 1: Black opening (1s)
    print("  [1/11] Black opening...")
    black = ColorClip(size=(WIDTH, HEIGHT), color=hex_to_rgb(COLORS["bg_primary"]))
    black = black.with_duration(1.0).with_fps(FPS)
    segments.append(black)

    # Shot 2: Birds on wires — retro video opener (2s)
    print("  [2/11] Birds on wires (retro cinematic)...")
    retro_clip = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-23-10-23-24.mp4"))
    birds = retro_clip.subclipped(0, 2.0)
    birds = fit_clip(birds)
    birds = birds.with_effects([vfx.FadeIn(0.3)])
    segments.append(birds)

    # Flash transition
    segments.append(create_flash_frame())

    # Shot 3: Cold plunge shock face (0.8s)
    print("  [3/11] Cold plunge reaction...")
    plunge_main = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-39.mp4"))
    shock = plunge_main.subclipped(2, 2.8)
    shock = fit_clip(shock)
    shock = shock.image_transform(color_grade_orange)
    segments.append(shock)

    # Shot 4: Brief darkness (0.5s)
    dark_pause = ColorClip(size=(WIDTH, HEIGHT), color=hex_to_rgb(COLORS["bg_primary"]))
    dark_pause = dark_pause.with_duration(0.5).with_fps(FPS)
    segments.append(dark_pause)

    # Shot 5: Group walking through arch (1.7s)
    print("  [4/11] Arch walk (cinematic)...")
    arch_walk = retro_clip.subclipped(10, 11.7)
    arch_walk = fit_clip(arch_walk)
    arch_walk = arch_walk.with_effects([vfx.FadeIn(0.15)])
    segments.append(arch_walk)

    # Flash
    segments.append(create_flash_frame())

    # Shot 6: You addressing group (0.8s)
    print("  [5/11] Leader addressing group...")
    leader = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-55-34.mp4"))
    leader_shot = leader.subclipped(3, 3.8)
    leader_shot = fit_clip(leader_shot)
    leader_shot = leader_shot.image_transform(color_grade_orange)
    segments.append(leader_shot)

    # Flash
    segments.append(create_flash_frame())

    # Shot 7: Top-down cold plunge submerge (1.5s)
    print("  [6/11] Cold plunge submerge (top-down)...")
    topdown = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-53-25.mp4"))
    submerge = topdown.subclipped(1, 2.5)
    submerge = fit_clip(submerge)
    submerge = submerge.image_transform(color_grade_orange)
    segments.append(submerge)

    # Flash
    segments.append(create_flash_frame())

    # Shot 8: Fit guy in ice (0.5s)
    print("  [7/11] Quick flash cuts...")
    fit_guy = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-00.mp4"))
    fit_shot = fit_guy.subclipped(5, 5.5)
    fit_shot = fit_clip(fit_shot)
    fit_shot = fit_shot.image_transform(color_grade_orange)
    segments.append(fit_shot)

    # Shot 9: Glasses guy (0.5s)
    glasses = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-05.mp4"))
    glasses_shot = glasses.subclipped(8, 8.5)
    glasses_shot = fit_clip(glasses_shot)
    glasses_shot = glasses_shot.image_transform(color_grade_orange)
    segments.append(glasses_shot)

    # Flash
    segments.append(create_flash_frame())

    # Shot 10: Group photo with Ken Burns zoom (1.5s)
    print("  [8/11] Group photo reveal...")
    group_img = Image.open(str(PHOTOS_DIR / "PHOTO-2025-07-09-11-25-15.jpg"))
    group_img = group_img.convert("RGB")
    group_array = np.array(group_img)
    group_clip = ImageClip(group_array).with_duration(1.5).with_fps(FPS)
    group_clip = fit_clip(group_clip)
    group_clip = group_clip.resized(lambda t: 1 + 0.03 * t)  # subtle zoom
    group_clip = group_clip.with_effects([vfx.FadeIn(0.2), vfx.FadeOut(0.3)])
    segments.append(group_clip)

    # Shot 11: Darkness before text (0.7s)
    pre_text = ColorClip(size=(WIDTH, HEIGHT), color=hex_to_rgb(COLORS["bg_primary"]))
    pre_text = pre_text.with_duration(0.7).with_fps(FPS)
    segments.append(pre_text)

    # Shot 12: "SPRINT SOCIETY" text slam (2.5s)
    print("  [9/11] SPRINT SOCIETY text slam...")
    title_clip = create_text_frame(
        "SPRINT SOCIETY",
        font_size=95,
        color="#FFFFFF",
        glow_color=COLORS["accent_orange"],
        duration=2.5,
    )
    title_clip = title_clip.with_effects([vfx.FadeIn(0.1)])
    segments.append(title_clip)

    # Shot 13: "COMING SOON" + tagline (2.5s)
    print("  [10/11] COMING SOON...")
    cta_clip = create_text_frame(
        "COMING SOON",
        font_size=60,
        color=COLORS["accent_red"],
        glow_color=COLORS["accent_red"],
        subtitle="For the runners, by the runners.",
        sub_size=26,
        duration=2.5,
    )
    cta_clip = cta_clip.with_effects([vfx.FadeIn(0.3), vfx.FadeOut(0.5)])
    segments.append(cta_clip)

    # Shot 14: Fade to black (1s)
    end_black = ColorClip(size=(WIDTH, HEIGHT), color=hex_to_rgb(COLORS["bg_primary"]))
    end_black = end_black.with_duration(1.0).with_fps(FPS)
    segments.append(end_black)

    # Assemble
    print("  [11/11] Assembling final timeline...")
    final = concatenate_videoclips(segments, method="compose")

    # Ensure output dir
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(OUTPUT_DIR / "teaser_01_coming_soon.mp4")

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
    retro_clip.close()
    plunge_main.close()
    leader.close()
    topdown.close()
    fit_guy.close()
    glasses.close()

    print(f"\n  DONE! Output: {output_path}")
    print(f"  Add music in CapCut/InShot and post!")
    return output_path


if __name__ == "__main__":
    build_teaser()
