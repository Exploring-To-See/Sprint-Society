"""
Kendu Studio — Teaser Reel 1 v2: "The Mystery Teaser" (Premium)
Cinematic grade, speed ramps, film grain, Remotion motion graphics.
"""

import sys
import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PROJECT_ROOT = Path(os.getcwd())
STUDIO_ROOT = PROJECT_ROOT / "studio"
sys.path.insert(0, str(STUDIO_ROOT))

from moviepy import (
    VideoFileClip,
    ImageClip,
    ColorClip,
    CompositeVideoClip,
    concatenate_videoclips,
    vfx,
)
from brand import COLORS, hex_to_rgb

OUTPUT_DIR = STUDIO_ROOT / "output"
CLIPS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "clips"
PHOTOS_DIR = PROJECT_ROOT / "video" / "public" / "assets" / "demo-run" / "photos"

WIDTH, HEIGHT = 1080, 1920
FPS = 30


# ─── CINEMATIC COLOR GRADING ───────────────────────────────────────────

def cinematic_grade(frame):
    """
    Professional cinematic color grade:
    - Crush blacks (raise floor to 12)
    - Push shadows toward teal
    - Push highlights toward orange/warm
    - Increase contrast
    - Reduce saturation slightly, boost skin tones
    """
    f = frame.astype(np.float32)

    # Crush blacks
    f = np.clip(f, 12, 255)

    # Contrast boost (S-curve approximation)
    midpoint = 128.0
    contrast = 1.25
    f = ((f - midpoint) * contrast + midpoint)

    # Teal shadows, orange highlights
    luminance = np.mean(f, axis=2, keepdims=True) / 255.0

    # Shadows: push blue/cyan
    shadow_mask = np.clip(1.0 - luminance * 2, 0, 1)
    f[:, :, 2] += shadow_mask[:, :, 0] * 12  # blue in shadows
    f[:, :, 1] += shadow_mask[:, :, 0] * 5   # slight green

    # Highlights: push orange/warm
    highlight_mask = np.clip(luminance * 2 - 1, 0, 1)
    f[:, :, 0] += highlight_mask[:, :, 0] * 15  # red in highlights
    f[:, :, 1] += highlight_mask[:, :, 0] * 8   # slight warmth

    # Slight desaturation (10%)
    gray = np.mean(f, axis=2, keepdims=True)
    f = f * 0.9 + gray * 0.1

    return np.clip(f, 0, 255).astype(np.uint8)


def add_film_grain(frame, intensity=0.035):
    """Add subtle film grain noise."""
    noise = np.random.normal(0, intensity * 255, frame.shape).astype(np.float32)
    grained = frame.astype(np.float32) + noise
    return np.clip(grained, 0, 255).astype(np.uint8)


def add_vignette(frame, intensity=0.5):
    """Add radial vignette darkening."""
    h, w = frame.shape[:2]
    Y, X = np.ogrid[:h, :w]
    cy, cx = h / 2, w / 2
    r = np.sqrt((X - cx) ** 2 / (cx ** 2) + (Y - cy) ** 2 / (cy ** 2))
    vignette = np.clip(1.0 - (r - 0.5) * intensity, 0.3, 1.0)
    vignette = vignette[:, :, np.newaxis]
    result = frame.astype(np.float32) * vignette
    return np.clip(result, 0, 255).astype(np.uint8)


def full_grade(frame):
    """Apply complete cinematic treatment."""
    frame = cinematic_grade(frame)
    frame = add_vignette(frame, 0.55)
    frame = add_film_grain(frame, 0.03)
    return frame


# ─── CLIP HELPERS ──────────────────────────────────────────────────────

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
    return clip.cropped(x1=x_off, y1=y_off, x2=x_off + target_w, y2=y_off + target_h)


def speed_ramp_out(clip, ramp_duration=0.3):
    """Apply slight speed-up via MultiplySpeed on the whole clip (simpler, avoids nested concat)."""
    return clip.with_effects([vfx.MultiplySpeed(1.15)])


def speed_ramp_in(clip, ramp_duration=0.2):
    """Apply slight slow-mo via MultiplySpeed (simpler, avoids nested concat)."""
    return clip.with_effects([vfx.MultiplySpeed(0.8)])


def create_light_leak(duration=0.4):
    """Create a warm light leak transition frame."""
    frames_count = int(duration * FPS)

    def make_frame(t):
        progress = t / duration
        img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

        # Warm orange/red gradient that fades
        intensity = int(180 * (1 - progress) ** 2)
        cx, cy = int(WIDTH * (0.3 + progress * 0.4)), int(HEIGHT * 0.4)
        Y, X = np.ogrid[:HEIGHT, :WIDTH]
        r = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2) / (WIDTH * 0.6)
        glow = np.clip(1.0 - r, 0, 1) ** 2

        img[:, :, 0] = np.clip(glow * intensity * 1.2, 0, 255).astype(np.uint8)  # red
        img[:, :, 1] = np.clip(glow * intensity * 0.5, 0, 255).astype(np.uint8)  # green
        img[:, :, 2] = np.clip(glow * intensity * 0.2, 0, 255).astype(np.uint8)  # blue
        return img

    from moviepy import VideoClip
    return VideoClip(make_frame, duration=duration).with_fps(FPS)


# ─── MAIN BUILD ────────────────────────────────────────────────────────

def build_teaser_v2():
    print("=" * 60)
    print("  KENDU STUDIO — Mystery Teaser v2 (Premium)")
    print("=" * 60)
    print()

    segments = []

    # ─── SHOT 1: Black with slow fade (1.2s) ───
    print("  [1/10] Dark opening...")
    black = ColorClip(size=(WIDTH, HEIGHT), color=(5, 5, 8))
    black = black.with_duration(1.2).with_fps(FPS)
    segments.append(black)

    # ─── SHOT 2: Birds on wires — retro cinematic (2.5s) ───
    print("  [2/10] Birds on wires (cinematic opener)...")
    retro = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-23-10-23-24.mp4"))
    birds = retro.subclipped(0.5, 3.0)
    birds = fit_clip(birds)
    birds = birds.image_transform(full_grade)
    birds = birds.with_effects([vfx.FadeIn(0.5)])
    birds = speed_ramp_out(birds, 0.3)
    segments.append(birds)

    # Light leak transition
    segments.append(create_light_leak(0.35))

    # ─── SHOT 3: Cold plunge shock (1.0s) with speed ramp ───
    print("  [3/10] Cold plunge reaction (speed ramped)...")
    plunge = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-39.mp4"))
    shock = plunge.subclipped(1.5, 2.5)
    shock = fit_clip(shock)
    shock = shock.image_transform(full_grade)
    shock = speed_ramp_in(shock, 0.2)
    segments.append(shock)

    # ─── SHOT 4: Darkness breath (0.4s) ───
    dark = ColorClip(size=(WIDTH, HEIGHT), color=(5, 5, 8))
    dark = dark.with_duration(0.4).with_fps(FPS)
    segments.append(dark)

    # ─── SHOT 5: Arch walk — cinematic (2.0s) ───
    print("  [4/10] Heritage arch walk (cinematic)...")
    arch = retro.subclipped(9.5, 11.5)
    arch = fit_clip(arch)
    arch = arch.image_transform(full_grade)
    arch = arch.with_effects([vfx.FadeIn(0.15)])
    arch = speed_ramp_out(arch, 0.25)
    segments.append(arch)

    # Light leak
    segments.append(create_light_leak(0.3))

    # ─── SHOT 6: You speaking (0.7s) ───
    print("  [5/10] Leader shot...")
    leader = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-55-34.mp4"))
    lead_shot = leader.subclipped(4, 4.7)
    lead_shot = fit_clip(lead_shot)
    lead_shot = lead_shot.image_transform(full_grade)
    segments.append(lead_shot)

    # ─── SHOT 7: Top-down plunge (1.2s) ───
    print("  [6/10] Cold plunge submerge...")
    topdown = VideoFileClip(str(CLIPS_DIR / "VIDEO-2025-07-06-13-53-25.mp4"))
    sub = topdown.subclipped(1.5, 2.7)
    sub = fit_clip(sub)
    sub = sub.image_transform(full_grade)
    sub = speed_ramp_in(sub, 0.3)
    segments.append(sub)

    # Light leak
    segments.append(create_light_leak(0.25))

    # ─── SHOT 8: Quick flash montage (1.5s — 3 shots) ───
    print("  [7/10] Flash montage...")
    flash_sources = []
    flash_clips_data = [
        (str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-00.mp4"), 5.0, 5.5),
        (str(CLIPS_DIR / "VIDEO-2025-07-06-13-54-05.mp4"), 7.5, 8.0),
        (str(CLIPS_DIR / "VIDEO-2025-07-06-13-53-35.mp4"), 5.0, 5.5),
    ]
    for path, start, end in flash_clips_data:
        c = VideoFileClip(path)
        flash_sources.append(c)
        shot = c.subclipped(start, end)
        shot = fit_clip(shot)
        shot = shot.image_transform(full_grade)
        segments.append(shot)

    # ─── SHOT 9: Group photo with drift zoom (1.8s) ───
    print("  [8/10] Group photo reveal...")
    group_img = np.array(Image.open(str(PHOTOS_DIR / "PHOTO-2025-07-09-11-25-15.jpg")).convert("RGB"))
    group_img = full_grade(group_img)
    group_clip = ImageClip(group_img).with_duration(1.8).with_fps(FPS)
    group_clip = fit_clip(group_clip)
    # Subtle drift zoom (1.0 → 1.05 over duration)
    group_clip = group_clip.resized(lambda t: 1 + 0.028 * t)
    group_clip = group_clip.with_effects([vfx.FadeIn(0.2), vfx.FadeOut(0.4)])
    segments.append(group_clip)

    # ─── SHOT 10: Dark breath before title (0.8s) ───
    pre_title = ColorClip(size=(WIDTH, HEIGHT), color=(5, 5, 8))
    pre_title = pre_title.with_duration(0.8).with_fps(FPS)
    segments.append(pre_title)

    # ─── SHOT 11: Remotion title slam (if rendered) OR fallback ───
    title_motion_path = STUDIO_ROOT / "output" / "title_slam_motion.mp4"
    if title_motion_path.exists():
        print("  [9/10] Remotion motion graphics title...")
        title_clip = VideoFileClip(str(title_motion_path))
        title_clip = fit_clip(title_clip)
        segments.append(title_clip)
        title_clip_ref = title_clip
    else:
        print("  [9/10] Fallback static title (Remotion not rendered yet)...")
        title_clip = _fallback_title(5.0)
        segments.append(title_clip)
        title_clip_ref = None

    # ─── SHOT 12: Fade to black (1.0s) ───
    print("  [10/10] Fade out...")
    end_black = ColorClip(size=(WIDTH, HEIGHT), color=(5, 5, 8))
    end_black = end_black.with_duration(1.0).with_fps(FPS)
    segments.append(end_black)

    # ─── FINAL ASSEMBLY ───
    print("\n  Assembling timeline...")
    final = concatenate_videoclips(segments, method="compose")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(OUTPUT_DIR / "teaser_01_v2_premium.mp4")

    print(f"  Duration: {final.duration:.1f}s | {WIDTH}x{HEIGHT} | {FPS}fps")
    print(f"  Rendering to: {output_path}")
    print()

    final.write_videofile(
        output_path,
        codec="libx264",
        fps=FPS,
        preset="medium",
        bitrate="12M",
        audio=False,
    )

    # Cleanup (close all source clips after render)
    for c in [retro, plunge, leader, topdown] + flash_sources:
        try:
            c.close()
        except:
            pass
    if title_clip_ref:
        try:
            title_clip_ref.close()
        except:
            pass

    print(f"\n  DONE! → {output_path}")
    return output_path


def _fallback_title(duration):
    """Fallback title if Remotion hasn't rendered yet."""
    from studio.agents.graphics import create_end_card
    img = create_end_card("COMING SOON")
    frame_array = np.array(img.convert("RGB"))
    clip = ImageClip(frame_array).with_duration(duration).with_fps(FPS)
    clip = clip.with_effects([vfx.FadeIn(0.3), vfx.FadeOut(0.5)])
    return clip


if __name__ == "__main__":
    build_teaser_v2()
