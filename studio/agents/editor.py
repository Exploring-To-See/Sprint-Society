"""
Kendu Studio — Editor Agent
Assembles video timelines using MoviePy + FFmpeg.
Handles cuts, transitions, speed ramping, color grading.
"""

import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from moviepy import (
    VideoFileClip,
    AudioFileClip,
    ImageClip,
    TextClip,
    CompositeVideoClip,
    concatenate_videoclips,
    vfx,
)
from brand import COLORS, PLATFORM_SPECS, STYLE_PROFILES, BRAND_RULES, hex_to_rgb

STUDIO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = STUDIO_ROOT / "output"


def subclip(clip_path: str, start: float, end: float) -> VideoFileClip:
    """Extract a subclip from a video file."""
    clip = VideoFileClip(clip_path)
    return clip.subclipped(start, min(end, clip.duration))


def create_timeline(
    shots: list[dict],
    format_key: str = "story",
    output_name: str = "output",
) -> str:
    """
    Assemble a timeline from a shot list.

    Each shot dict:
    {
        "clip": "path/to/clip.mp4",
        "start": 0.0,        # start time in source clip
        "end": 2.0,          # end time in source clip
        "speed": 1.0,        # playback speed (0.5 = slow-mo, 2.0 = fast)
        "transition_in": "cut" | "fade" | "flash",
        "transition_duration": 0.3,
    }
    """
    specs = PLATFORM_SPECS[format_key]
    target_w, target_h = specs["width"], specs["height"]
    target_fps = specs["fps"]

    segments = []

    for shot in shots:
        clip = VideoFileClip(shot["clip"])

        start = shot.get("start", 0)
        end = shot.get("end", clip.duration)
        segment = clip.subclipped(start, min(end, clip.duration))

        speed = shot.get("speed", 1.0)
        if speed != 1.0:
            segment = segment.with_effects([vfx.MultiplySpeed(speed)])

        segment = _fit_to_frame(segment, target_w, target_h)

        transition = shot.get("transition_in", "cut")
        t_dur = shot.get("transition_duration", 0.3)
        if transition == "fade":
            segment = segment.with_effects([vfx.FadeIn(t_dur)])
        elif transition == "flash":
            segment = segment.with_effects([vfx.FadeIn(0.1)])

        segments.append(segment)

    if not segments:
        raise ValueError("No shots in timeline")

    final = concatenate_videoclips(segments, method="compose")
    final = final.with_fps(target_fps)

    output_path = str(OUTPUT_DIR / f"{output_name}_{format_key}.mp4")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    final.write_videofile(
        output_path,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        bitrate="8M",
    )

    for seg in segments:
        seg.close()
    final.close()

    return output_path


def apply_color_grade(clip: VideoFileClip, style: str = "hype") -> VideoFileClip:
    """Apply color grading based on style profile."""
    import numpy as np

    profile = STYLE_PROFILES.get(style, STYLE_PROFILES["hype"])
    tint_color = hex_to_rgb(profile["primary_color"])

    def grade_frame(frame):
        graded = frame.astype(np.float32)
        graded *= 0.85
        tint_layer = np.array(tint_color, dtype=np.float32) / 255.0
        graded[:, :, 0] += tint_layer[0] * 20
        graded[:, :, 1] += tint_layer[1] * 10
        graded[:, :, 2] += tint_layer[2] * 10
        contrast = 1.2
        graded = ((graded - 128) * contrast + 128)
        return np.clip(graded, 0, 255).astype(np.uint8)

    return clip.image_transform(grade_frame)


def add_dark_overlay(clip: VideoFileClip, opacity: float = 0.4) -> CompositeVideoClip:
    """Add a dark vignette/overlay to a clip."""
    from PIL import Image
    import numpy as np

    w, h = clip.size
    gradient = np.zeros((h, w, 4), dtype=np.uint8)
    center_y, center_x = h // 2, w // 2

    for y in range(h):
        for x in range(w):
            dist = ((x - center_x) ** 2 / (center_x ** 2) + (y - center_y) ** 2 / (center_y ** 2)) ** 0.5
            alpha = int(min(255, dist * 255 * opacity))
            gradient[y, x] = [0, 0, 0, alpha]

    overlay_img = Image.fromarray(gradient, 'RGBA')
    overlay_path = str(STUDIO_ROOT / "assets" / "overlays" / "vignette_temp.png")
    overlay_img.save(overlay_path)

    overlay_clip = ImageClip(overlay_path).with_duration(clip.duration)
    return CompositeVideoClip([clip, overlay_clip])


def create_flash_cut_sequence(
    clips: list[str],
    cut_duration: float = 0.6,
    format_key: str = "story",
    style: str = "hype",
) -> str:
    """
    Create a fast-cut sequence from multiple clips.
    Used for hype reels, teasers, montages.
    """
    specs = PLATFORM_SPECS[format_key]
    target_w, target_h = specs["width"], specs["height"]

    segments = []
    for i, clip_path in enumerate(clips):
        clip = VideoFileClip(clip_path)
        mid = clip.duration / 2
        start = max(0, mid - cut_duration / 2)
        end = min(clip.duration, mid + cut_duration / 2)

        segment = clip.subclipped(start, end)
        segment = _fit_to_frame(segment, target_w, target_h)
        segment = segment.with_effects([vfx.FadeIn(0.08), vfx.FadeOut(0.08)])

        segments.append(segment)

    final = concatenate_videoclips(segments, method="compose")
    output_path = str(OUTPUT_DIR / f"flash_cuts_{style}.mp4")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    final.write_videofile(output_path, codec="libx264", preset="fast", bitrate="8M")

    for seg in segments:
        seg.close()
    final.close()

    return output_path


def _fit_to_frame(clip: VideoFileClip, target_w: int, target_h: int) -> VideoFileClip:
    """Resize and crop a clip to fit target dimensions (cover fit)."""
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

    x_offset = (new_w - target_w) // 2
    y_offset = (new_h - target_h) // 2
    clip = clip.cropped(x1=x_offset, y1=y_offset, x2=x_offset + target_w, y2=y_offset + target_h)

    return clip


if __name__ == "__main__":
    print("=" * 50)
    print("KENDU STUDIO — Editor Agent")
    print("=" * 50)
    print("\nCapabilities:")
    print("  - create_timeline(shots, format, name)")
    print("  - create_flash_cut_sequence(clips, duration, format, style)")
    print("  - apply_color_grade(clip, style)")
    print("  - add_dark_overlay(clip, opacity)")
    print(f"\nOutput directory: {OUTPUT_DIR}")
