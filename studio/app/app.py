"""
Kendu Studio — AI Video Generation Dashboard
One-click cinematic video generation for Sprint Society and beyond.

Usage:
    python app.py
    → Opens http://localhost:5555 in your browser
"""

import os
import sys
import json
import time
import webbrowser
import threading
from pathlib import Path
from datetime import datetime

from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Add parent dirs to path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv(Path(__file__).parent / ".env")

from generators.fal_generator import FalGenerator
from generators.replicate_generator import ReplicateGenerator
from generators.storyboard_engine import StoryboardEngine
from pipelines.assembly import AssemblyPipeline
from pipelines.social import SocialPublisher

app = Flask(__name__)

# ── Config ──
STUDIO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = STUDIO_ROOT / "output"
CLIPS_DIR = STUDIO_ROOT / "output" / "clips"
PROJECTS_DIR = STUDIO_ROOT / "output" / "projects"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

# ── State ──
generation_jobs = {}


# ══════════════════════════════════════════════════════════════
# PAGES
# ══════════════════════════════════════════════════════════════

@app.route("/")
def dashboard():
    projects = _get_projects()
    return render_template("dashboard.html", projects=projects)


@app.route("/generate")
def generate_page():
    return render_template("generate.html")


@app.route("/library")
def library_page():
    clips = _get_clips()
    return render_template("library.html", clips=clips)


@app.route("/publish")
def publish_page():
    return render_template("publish.html")


# ══════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════

@app.route("/api/generate/quick", methods=["POST"])
def api_generate_quick():
    """Generate a single video clip from a prompt."""
    data = request.json
    prompt = data.get("prompt", "")
    duration = data.get("duration", 5)
    aspect_ratio = data.get("aspect_ratio", "9:16")
    provider = data.get("provider", "fal")
    model = data.get("model", "wan2.1")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    job_id = f"job_{int(time.time())}_{hash(prompt) % 10000}"

    if provider == "fal":
        gen = FalGenerator()
        result = gen.generate(prompt, duration=duration, aspect_ratio=aspect_ratio, model=model)
    elif provider == "replicate":
        gen = ReplicateGenerator()
        result = gen.generate(prompt, duration=duration, aspect_ratio=aspect_ratio, model=model)
    else:
        return jsonify({"error": f"Unknown provider: {provider}"}), 400

    generation_jobs[job_id] = {
        "status": result.get("status", "submitted"),
        "provider": provider,
        "prompt": prompt,
        "result": result,
        "created_at": datetime.now().isoformat(),
    }

    return jsonify({"job_id": job_id, **result})


@app.route("/api/generate/film", methods=["POST"])
def api_generate_film():
    """Full pipeline: concept → storyboard → generate clips → assemble."""
    data = request.json
    concept = data.get("concept", "")
    style = data.get("style", "cinematic")
    duration_target = data.get("duration", 30)
    aspect_ratio = data.get("aspect_ratio", "9:16")
    provider = data.get("provider", "fal")

    if not concept:
        return jsonify({"error": "Concept is required"}), 400

    project_id = f"film_{int(time.time())}"
    project_dir = PROJECTS_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Generate storyboard
    engine = StoryboardEngine()
    storyboard = engine.create_storyboard(concept, style=style, target_duration=duration_target)

    # Save storyboard
    with open(project_dir / "storyboard.json", "w") as f:
        json.dump(storyboard, f, indent=2)

    # Step 2: Start generating clips (async in background)
    generation_jobs[project_id] = {
        "status": "storyboard_complete",
        "project_dir": str(project_dir),
        "storyboard": storyboard,
        "clips_generated": 0,
        "clips_total": len(storyboard.get("shots", [])),
        "created_at": datetime.now().isoformat(),
    }

    # Launch generation in background thread
    thread = threading.Thread(
        target=_generate_film_clips,
        args=(project_id, storyboard, provider, aspect_ratio, project_dir),
    )
    thread.daemon = True
    thread.start()

    return jsonify({
        "project_id": project_id,
        "status": "generating",
        "storyboard": storyboard,
        "message": f"Generating {len(storyboard.get('shots', []))} clips...",
    })


@app.route("/api/generate/storyboard", methods=["POST"])
def api_generate_storyboard():
    """Generate just the storyboard (for review before generating clips)."""
    data = request.json
    concept = data.get("concept", "")
    style = data.get("style", "cinematic")
    duration_target = data.get("duration", 30)

    engine = StoryboardEngine()
    storyboard = engine.create_storyboard(concept, style=style, target_duration=duration_target)
    return jsonify(storyboard)


@app.route("/api/status/<job_id>")
def api_status(job_id):
    """Check status of a generation job."""
    job = generation_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


@app.route("/api/library")
def api_library():
    """List all generated clips and videos."""
    clips = _get_clips()
    return jsonify(clips)


@app.route("/api/publish", methods=["POST"])
def api_publish():
    """Publish a video to social media platforms."""
    data = request.json
    video_path = data.get("video_path", "")
    platforms = data.get("platforms", [])
    caption = data.get("caption", "")
    hashtags = data.get("hashtags", [])

    publisher = SocialPublisher()
    results = publisher.publish(video_path, platforms, caption, hashtags)
    return jsonify(results)


@app.route("/api/config", methods=["GET", "POST"])
def api_config():
    """Get or update API configuration."""
    config_path = Path(__file__).parent / ".env"

    if request.method == "GET":
        config = {
            "fal_key": bool(os.getenv("FAL_KEY")),
            "replicate_token": bool(os.getenv("REPLICATE_API_TOKEN")),
            "anthropic_key": bool(os.getenv("ANTHROPIC_API_KEY")),
            "instagram_token": bool(os.getenv("INSTAGRAM_TOKEN")),
            "twitter_keys": bool(os.getenv("TWITTER_API_KEY")),
            "youtube_key": bool(os.getenv("YOUTUBE_API_KEY")),
        }
        return jsonify(config)

    elif request.method == "POST":
        data = request.json
        lines = []
        for key, value in data.items():
            if value:
                lines.append(f"{key.upper()}={value}")
        config_path.write_text("\n".join(lines))
        load_dotenv(config_path, override=True)
        return jsonify({"status": "saved"})


# ── Serve output files ──
@app.route("/output/<path:filename>")
def serve_output(filename):
    return send_from_directory(str(OUTPUT_DIR), filename)


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def _generate_film_clips(project_id, storyboard, provider, aspect_ratio, project_dir):
    """Background: generate all clips for a film project."""
    gen = FalGenerator() if provider == "fal" else ReplicateGenerator()
    clips = []

    for i, shot in enumerate(storyboard.get("shots", [])):
        try:
            result = gen.generate(
                shot["generation_prompt"],
                duration=shot.get("duration", 5),
                aspect_ratio=aspect_ratio,
                model="wan2.1",
            )
            clips.append({
                "shot_id": shot["id"],
                "result": result,
                "status": "completed" if result.get("url") else "submitted",
            })
            generation_jobs[project_id]["clips_generated"] = i + 1
            generation_jobs[project_id]["status"] = "generating"
        except Exception as e:
            clips.append({"shot_id": shot["id"], "error": str(e), "status": "failed"})

    generation_jobs[project_id]["status"] = "clips_complete"
    generation_jobs[project_id]["clips"] = clips

    # Step 3: Assemble if all clips have URLs
    clip_urls = [c["result"].get("url") for c in clips if c.get("result", {}).get("url")]
    if clip_urls:
        try:
            assembler = AssemblyPipeline()
            output_path = assembler.assemble(clip_urls, project_dir / "final.mp4")
            generation_jobs[project_id]["status"] = "complete"
            generation_jobs[project_id]["output"] = str(output_path)
        except Exception as e:
            generation_jobs[project_id]["status"] = "assembly_failed"
            generation_jobs[project_id]["error"] = str(e)


def _get_projects():
    """List all film projects."""
    projects = []
    if PROJECTS_DIR.exists():
        for p in sorted(PROJECTS_DIR.iterdir(), reverse=True):
            if p.is_dir():
                storyboard_file = p / "storyboard.json"
                projects.append({
                    "id": p.name,
                    "path": str(p),
                    "has_storyboard": storyboard_file.exists(),
                    "has_output": (p / "final.mp4").exists(),
                    "created": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
                })
    return projects[:20]


def _get_clips():
    """List all generated clips."""
    clips = []
    for ext in ["*.mp4", "*.webm", "*.gif"]:
        for f in OUTPUT_DIR.rglob(ext):
            clips.append({
                "name": f.name,
                "path": str(f.relative_to(OUTPUT_DIR)),
                "size_mb": round(f.stat().st_size / 1024 / 1024, 2),
                "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })
    return sorted(clips, key=lambda x: x["created"], reverse=True)[:50]


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5555))
    print()
    print("=" * 60)
    print("  KENDU STUDIO — AI Video Generation Dashboard")
    print(f"  http://localhost:{port}")
    print("=" * 60)
    print()
    print("  Pages:")
    print(f"    Dashboard  -> http://localhost:{port}/")
    print(f"    Generate   -> http://localhost:{port}/generate")
    print(f"    Library    -> http://localhost:{port}/library")
    print(f"    Publish    -> http://localhost:{port}/publish")
    print()

    # Auto-open browser
    threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{port}")).start()

    app.run(host="0.0.0.0", port=port, debug=False)
