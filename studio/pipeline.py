"""
Kendu Studio — Pipeline Orchestrator
Coordinates all agents through the production pipeline.
Run this to initialize a project or check studio status.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

STUDIO_ROOT = Path(__file__).parent
sys.path.insert(0, str(STUDIO_ROOT))

from brand import COLORS, FONTS, PLATFORM_SPECS, STYLE_PROFILES, BRAND_RULES


AGENTS = {
    "director": "Interprets brief, coordinates workflow, gets approvals",
    "research": "Studies competitors, trending formats, platform best practices",
    "creative": "Writes scripts, storyboards, shot lists, visual language",
    "vision": "Extracts frames, analyzes content, identifies best moments",
    "editor": "Assembles timeline, cuts clips, transitions, color grading",
    "graphics": "Text overlays, branded elements, stat cards, motion graphics",
    "audio": "Music selection/generation, beat sync, sound design",
    "ai_gen": "AI video generation prompts for Kling/HailuoAI/Pika",
    "qa": "Brand check, quality score, platform spec verification",
}

PIPELINE_STAGES = [
    {"id": "brief", "name": "Brief & Research", "agent": "research"},
    {"id": "creative", "name": "Creative Development", "agent": "creative"},
    {"id": "analysis", "name": "Asset Analysis", "agent": "vision"},
    {"id": "ai_gen", "name": "AI Generation", "agent": "ai_gen"},
    {"id": "assembly", "name": "Assembly & Edit", "agent": "editor"},
    {"id": "graphics", "name": "Graphics & Overlays", "agent": "graphics"},
    {"id": "qa", "name": "QA & Delivery", "agent": "qa"},
]


def init_project(project_name: str) -> Path:
    """Initialize a new project directory with required files."""
    project_dir = STUDIO_ROOT / "projects" / project_name
    project_dir.mkdir(parents=True, exist_ok=True)

    state = {
        "project": project_name,
        "created": datetime.now().isoformat(),
        "current_stage": "brief",
        "stages_completed": [],
        "format": "story",
        "style": "hype",
        "assets": [],
        "approvals": {},
    }

    state_file = project_dir / "state.json"
    if not state_file.exists():
        with open(state_file, "w") as f:
            json.dump(state, f, indent=2)

    brief_file = project_dir / "brief.md"
    if not brief_file.exists():
        brief_file.write_text(f"# {project_name.replace('-', ' ').title()} — Production Brief\n\n**Created:** {datetime.now().strftime('%Y-%m-%d')}\n\n## Objective\n\n_To be filled by Director_\n\n## Format\n\n- Aspect: Story (9:16)\n- Duration: TBD\n- Style: Hype\n\n## Assets Available\n\n_To be filled by Vision Analyst_\n")

    print(f"Project initialized: {project_dir}")
    return project_dir


def get_project_state(project_name: str) -> dict:
    """Load current project state."""
    state_file = STUDIO_ROOT / "projects" / project_name / "state.json"
    if state_file.exists():
        with open(state_file) as f:
            return json.load(f)
    return None


def update_project_state(project_name: str, updates: dict):
    """Update project state."""
    state_file = STUDIO_ROOT / "projects" / project_name / "state.json"
    state = get_project_state(project_name) or {}
    state.update(updates)
    with open(state_file, "w") as f:
        json.dump(state, f, indent=2)


def print_status():
    """Print studio status and all projects."""
    print("=" * 60)
    print("  KENDU STUDIO — Sprint Society Video Production")
    print("=" * 60)
    print()
    print("  TEAM:")
    for agent, role in AGENTS.items():
        print(f"    [{agent.upper():10s}] {role}")
    print()
    print("  PIPELINE:")
    for i, stage in enumerate(PIPELINE_STAGES, 1):
        print(f"    Stage {i}: {stage['name']} ({stage['agent']})")
    print()

    projects_dir = STUDIO_ROOT / "projects"
    projects = [p for p in projects_dir.iterdir() if p.is_dir()]

    if projects:
        print("  ACTIVE PROJECTS:")
        for proj in projects:
            state = get_project_state(proj.name)
            if state:
                stage = state.get("current_stage", "unknown")
                print(f"    [{proj.name}] Stage: {stage} | Style: {state.get('style', 'N/A')}")
            else:
                print(f"    [{proj.name}] (no state)")
    else:
        print("  No active projects.")

    print()
    print("  BRAND: Dark + Orange/Red energy")
    print(f"  OUTPUT: {STUDIO_ROOT / 'output'}")
    print()


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--project" in args:
        idx = args.index("--project")
        project_name = args[idx + 1] if idx + 1 < len(args) else "untitled"
        init_project(project_name)
    else:
        print_status()
