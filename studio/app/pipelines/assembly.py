"""
Video Assembly Pipeline — Downloads clips and stitches them with transitions.
Uses ffmpeg for final assembly.
"""

import os
import subprocess
import tempfile
from pathlib import Path
import httpx


class AssemblyPipeline:
    def __init__(self):
        self.ffmpeg_path = self._find_ffmpeg()

    def _find_ffmpeg(self) -> str:
        for path in ["ffmpeg", "ffmpeg.exe", r"C:\ffmpeg\bin\ffmpeg.exe"]:
            try:
                result = subprocess.run([path, "-version"], capture_output=True, timeout=5)
                if result.returncode == 0:
                    return path
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        return "ffmpeg"

    def assemble(self, clip_urls: list, output_path: str | Path,
                 transition: str = "fade", transition_duration: float = 0.5) -> Path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Download clips
        temp_dir = Path(tempfile.mkdtemp(prefix="kendu_"))
        local_clips = []

        for i, url in enumerate(clip_urls):
            if not url:
                continue
            local_path = temp_dir / f"clip_{i:03d}.mp4"
            self._download_clip(url, local_path)
            if local_path.exists() and local_path.stat().st_size > 0:
                local_clips.append(local_path)

        if not local_clips:
            raise ValueError("No clips were downloaded successfully")

        # Create concat file
        concat_file = temp_dir / "concat.txt"
        with open(concat_file, "w") as f:
            for clip in local_clips:
                f.write(f"file '{clip}'\n")

        # Assemble with ffmpeg
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(output_path),
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, timeout=300)
            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg error: {result.stderr.decode()[:500]}")
        except FileNotFoundError:
            raise RuntimeError(
                "ffmpeg not found. Install it: https://ffmpeg.org/download.html"
            )

        # Cleanup temp files
        for f in temp_dir.iterdir():
            f.unlink()
        temp_dir.rmdir()

        return output_path

    def _download_clip(self, url: str, output_path: Path):
        try:
            with httpx.Client(timeout=120, follow_redirects=True) as client:
                with client.stream("GET", url) as response:
                    with open(output_path, "wb") as f:
                        for chunk in response.iter_bytes(chunk_size=8192):
                            f.write(chunk)
        except Exception as e:
            print(f"  Failed to download {url[:80]}: {e}")

    def add_music(self, video_path: Path, audio_path: Path, output_path: Path) -> Path:
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]
        subprocess.run(cmd, capture_output=True, timeout=120)
        return output_path
