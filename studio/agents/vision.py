"""
Kendu Studio — Vision Analyst Agent
Extracts frames from video clips for analysis by Claude Vision.
Performs automated scene detection and quality scoring.
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Optional


STUDIO_ROOT = Path(__file__).parent.parent
FRAMES_DIR = STUDIO_ROOT / "assets" / "frames"


def get_clip_info(clip_path: str) -> dict:
    """Get video clip metadata using FFmpeg/MoviePy."""
    from moviepy import VideoFileClip
    clip = VideoFileClip(clip_path)
    info = {
        "path": clip_path,
        "filename": os.path.basename(clip_path),
        "duration": round(clip.duration, 2),
        "size": list(clip.size),
        "fps": clip.fps,
        "width": clip.size[0],
        "height": clip.size[1],
        "orientation": "vertical" if clip.size[1] > clip.size[0] else "horizontal",
        "aspect_ratio": f"{clip.size[0]}:{clip.size[1]}",
    }
    clip.close()
    return info


def extract_frames(
    clip_path: str,
    output_dir: Optional[str] = None,
    fps: float = 2.0,
    quality: int = 2,
    max_frames: int = 20,
) -> list[str]:
    """
    Extract frames from a video clip at specified FPS.
    Returns list of frame file paths.

    Args:
        clip_path: Path to the video file
        output_dir: Where to save frames (default: studio/assets/frames/<clip_name>/)
        fps: Frames per second to extract (default 2 = 1 frame every 0.5s)
        quality: JPEG quality (2=best, 31=worst)
        max_frames: Maximum frames to extract
    """
    clip_name = Path(clip_path).stem
    if output_dir is None:
        output_dir = str(FRAMES_DIR / clip_name)

    os.makedirs(output_dir, exist_ok=True)

    from moviepy import VideoFileClip
    clip = VideoFileClip(clip_path)
    duration = clip.duration
    clip.close()

    actual_fps = min(fps, max_frames / duration) if duration > 0 else fps

    frame_pattern = os.path.join(output_dir, f"{clip_name}_frame_%03d.jpg")

    cmd = [
        "ffmpeg", "-y",
        "-i", clip_path,
        "-vf", f"fps={actual_fps}",
        "-qscale:v", str(quality),
        "-frames:v", str(max_frames),
        frame_pattern,
    ]

    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
    except FileNotFoundError:
        return _extract_frames_moviepy(clip_path, output_dir, clip_name, actual_fps, max_frames)

    frames = sorted([
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.startswith(clip_name) and f.endswith(".jpg")
    ])
    return frames


def _extract_frames_moviepy(
    clip_path: str,
    output_dir: str,
    clip_name: str,
    fps: float,
    max_frames: int
) -> list[str]:
    """Fallback: extract frames using MoviePy when FFmpeg CLI isn't available."""
    from moviepy import VideoFileClip
    clip = VideoFileClip(clip_path)

    interval = 1.0 / fps
    frames = []
    t = 0.0
    frame_idx = 0

    while t < clip.duration and frame_idx < max_frames:
        frame = clip.get_frame(t)
        frame_path = os.path.join(output_dir, f"{clip_name}_frame_{frame_idx:03d}.jpg")

        from PIL import Image
        import numpy as np
        img = Image.fromarray(frame.astype(np.uint8))
        img.save(frame_path, quality=90)

        frames.append(frame_path)
        t += interval
        frame_idx += 1

    clip.close()
    return frames


def extract_keyframes_all_clips(clips_dir: str, fps: float = 1.0) -> dict[str, list[str]]:
    """
    Extract keyframes from ALL clips in a directory.
    Returns dict mapping clip filename to list of frame paths.
    """
    results = {}
    clips_path = Path(clips_dir)

    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

    for clip_file in sorted(clips_path.iterdir()):
        if clip_file.suffix.lower() in video_extensions:
            frames = extract_frames(str(clip_file), fps=fps)
            results[clip_file.name] = frames
            print(f"  Extracted {len(frames)} frames from {clip_file.name}")

    return results


def generate_analysis_report(clips_dir: str) -> str:
    """
    Generates a report of all clips with metadata.
    This report + extracted frames are then shown to Claude Vision for analysis.
    """
    clips_path = Path(clips_dir)
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

    report_lines = ["# Clip Analysis Report\n"]
    total_duration = 0

    for clip_file in sorted(clips_path.iterdir()):
        if clip_file.suffix.lower() in video_extensions:
            info = get_clip_info(str(clip_file))
            total_duration += info["duration"]
            report_lines.append(f"## {info['filename']}")
            report_lines.append(f"- Duration: {info['duration']}s")
            report_lines.append(f"- Resolution: {info['width']}x{info['height']} ({info['orientation']})")
            report_lines.append(f"- FPS: {info['fps']}")
            report_lines.append("")

    report_lines.insert(1, f"**Total clips:** {len(report_lines) // 5}")
    report_lines.insert(2, f"**Total duration:** {round(total_duration, 1)}s ({round(total_duration/60, 1)} min)\n")

    return "\n".join(report_lines)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python vision.py <clips_directory>")
        print("  Extracts frames and generates analysis report")
        sys.exit(1)

    clips_dir = sys.argv[1]

    print("=" * 50)
    print("KENDU STUDIO — Vision Analyst")
    print("=" * 50)
    print(f"\nAnalyzing clips in: {clips_dir}\n")

    report = generate_analysis_report(clips_dir)
    print(report)

    print("\nExtracting keyframes...")
    results = extract_keyframes_all_clips(clips_dir, fps=1.0)

    total_frames = sum(len(f) for f in results.values())
    print(f"\nDone! Extracted {total_frames} frames from {len(results)} clips.")
    print(f"Frames saved to: {FRAMES_DIR}")
    print("\nNext step: Show frames to Claude Vision for content analysis.")
