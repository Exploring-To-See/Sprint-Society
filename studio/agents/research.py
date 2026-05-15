"""
Kendu Studio — Research & Learning Agent
Analyzes trends, discovers new AI tools, and saves learnings for the team.

Responsibilities:
1. Research latest trending content formats on Instagram/X/YouTube
2. Track AI videomaking upgrades (GitHub repos, tool updates, new techniques)
3. Pass research findings to other agents as context
4. Save important learnings to studio memory for future use
5. Continuously improve the studio's capabilities over time

This agent runs FIRST before any production starts, and its findings
inform the Creative Director and all production agents.
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

STUDIO_ROOT = Path(__file__).parent.parent
MEMORY_DIR = STUDIO_ROOT / "memory"
RESEARCH_DIR = STUDIO_ROOT / "research"


def init():
    """Initialize research directories."""
    MEMORY_DIR.mkdir(exist_ok=True)
    RESEARCH_DIR.mkdir(exist_ok=True)
    (MEMORY_DIR / "trends").mkdir(exist_ok=True)
    (MEMORY_DIR / "techniques").mkdir(exist_ok=True)
    (MEMORY_DIR / "tools").mkdir(exist_ok=True)


def save_learning(category: str, title: str, content: str, tags: list[str] = None):
    """
    Save a learning to studio memory for future use.

    Categories: trends, techniques, tools, references, mistakes
    """
    init()
    category_dir = MEMORY_DIR / category
    category_dir.mkdir(exist_ok=True)

    slug = title.lower().replace(" ", "-").replace("/", "-")[:50]
    filename = f"{slug}.md"

    entry = {
        "title": title,
        "category": category,
        "saved_at": datetime.now().isoformat(),
        "tags": tags or [],
        "content": content,
    }

    filepath = category_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(f"**Category:** {category}\n")
        f.write(f"**Saved:** {entry['saved_at'][:10]}\n")
        f.write(f"**Tags:** {', '.join(tags or [])}\n\n")
        f.write(f"---\n\n{content}\n")

    _update_index()
    return filepath


def load_learnings(category: str = None, tags: list[str] = None) -> list[dict]:
    """Load saved learnings, optionally filtered by category or tags."""
    init()
    results = []

    search_dirs = [MEMORY_DIR / category] if category else [
        d for d in MEMORY_DIR.iterdir() if d.is_dir()
    ]

    for dir_path in search_dirs:
        if not dir_path.exists():
            continue
        for file in dir_path.glob("*.md"):
            content = file.read_text(encoding="utf-8")
            entry = {
                "file": str(file),
                "category": dir_path.name,
                "content": content,
            }
            if tags:
                if any(tag.lower() in content.lower() for tag in tags):
                    results.append(entry)
            else:
                results.append(entry)

    return results


def save_research_brief(project_name: str, brief: dict):
    """
    Save a research brief for a specific project.
    This is passed to other agents as context before they start work.

    Brief structure:
    {
        "trending_formats": [...],
        "competitor_analysis": [...],
        "ai_tools_recommended": [...],
        "style_recommendations": [...],
        "music_direction": [...],
        "key_insights": [...],
    }
    """
    init()
    project_dir = STUDIO_ROOT / "projects" / project_name
    project_dir.mkdir(parents=True, exist_ok=True)

    brief["researched_at"] = datetime.now().isoformat()
    brief_path = project_dir / "research_brief.json"

    with open(brief_path, "w", encoding="utf-8") as f:
        json.dump(brief, f, indent=2)

    brief_md = project_dir / "research_brief.md"
    with open(brief_md, "w", encoding="utf-8") as f:
        f.write(f"# Research Brief — {project_name}\n\n")
        f.write(f"**Date:** {brief['researched_at'][:10]}\n\n")

        if "trending_formats" in brief:
            f.write("## Trending Formats\n\n")
            for item in brief["trending_formats"]:
                f.write(f"- {item}\n")
            f.write("\n")

        if "competitor_analysis" in brief:
            f.write("## Competitor Analysis\n\n")
            for item in brief["competitor_analysis"]:
                f.write(f"- {item}\n")
            f.write("\n")

        if "ai_tools_recommended" in brief:
            f.write("## AI Tools to Leverage\n\n")
            for item in brief["ai_tools_recommended"]:
                f.write(f"- {item}\n")
            f.write("\n")

        if "style_recommendations" in brief:
            f.write("## Style Recommendations\n\n")
            for item in brief["style_recommendations"]:
                f.write(f"- {item}\n")
            f.write("\n")

        if "key_insights" in brief:
            f.write("## Key Insights\n\n")
            for item in brief["key_insights"]:
                f.write(f"- {item}\n")
            f.write("\n")

    return brief_path


def get_research_context(project_name: str) -> Optional[dict]:
    """Load research brief for a project (used by other agents)."""
    brief_path = STUDIO_ROOT / "projects" / project_name / "research_brief.json"
    if brief_path.exists():
        with open(brief_path) as f:
            return json.load(f)
    return None


def _update_index():
    """Update the memory index file."""
    init()
    index_path = MEMORY_DIR / "INDEX.md"
    lines = ["# Kendu Studio — Learning Memory\n\n"]
    lines.append(f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}_\n\n")

    for category_dir in sorted(MEMORY_DIR.iterdir()):
        if category_dir.is_dir() and category_dir.name != "__pycache__":
            files = list(category_dir.glob("*.md"))
            if files:
                lines.append(f"## {category_dir.name.title()} ({len(files)} entries)\n\n")
                for f in sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)[:10]:
                    lines.append(f"- [{f.stem}]({category_dir.name}/{f.name})\n")
                lines.append("\n")

    index_path.write_text("".join(lines), encoding="utf-8")


if __name__ == "__main__":
    init()
    print("=" * 50)
    print("KENDU STUDIO — Research & Learning Agent")
    print("=" * 50)
    print()
    print("Capabilities:")
    print("  - Research trends (Instagram, X, YouTube)")
    print("  - Track AI videomaking tools & techniques")
    print("  - Save learnings to studio memory")
    print("  - Generate research briefs for projects")
    print("  - Load context for other agents")
    print()

    learnings = load_learnings()
    if learnings:
        print(f"Memory: {len(learnings)} saved learnings")
    else:
        print("Memory: Empty (will grow as we work)")
    print(f"Memory dir: {MEMORY_DIR}")
