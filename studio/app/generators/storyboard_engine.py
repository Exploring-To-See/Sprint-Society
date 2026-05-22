"""
AI Storyboard Engine — Uses Claude API or local templates to break
a video concept into shot-by-shot generation prompts.
"""

import os
import json
import httpx
from datetime import datetime


STYLE_PRESETS = {
    "cinematic": {
        "camera_style": "cinematic slow dolly, shallow depth of field, anamorphic lens",
        "color_grade": "orange and teal color grading, film grain, high contrast",
        "lighting": "golden hour, dramatic rim lighting, volumetric haze",
        "motion": "slow motion, smooth tracking shot",
        "negative": "cartoon, anime, 3d render, text, watermark, overexposed, flat lighting",
    },
    "hype": {
        "camera_style": "dynamic handheld, whip pan, fast cuts",
        "color_grade": "high saturation, crushed blacks, neon accents",
        "lighting": "hard contrast, neon, strobe",
        "motion": "fast motion, speed ramps, quick cuts",
        "negative": "still, static, boring, flat, washed out",
    },
    "documentary": {
        "camera_style": "handheld, observational, natural framing",
        "color_grade": "desaturated, natural tones, muted",
        "lighting": "available light, natural, soft",
        "motion": "steady cam, slight drift, observational",
        "negative": "dramatic, stylized, neon, artificial",
    },
    "luxury": {
        "camera_style": "smooth dolly, macro details, slow reveal",
        "color_grade": "rich deep blacks, gold highlights, minimal",
        "lighting": "product lighting, rim light, dark background",
        "motion": "extremely slow, graceful, floating",
        "negative": "cheap, bright, cluttered, messy",
    },
    "social-viral": {
        "camera_style": "POV, selfie angle, vertical framing",
        "color_grade": "vibrant, slightly overexposed, warm",
        "lighting": "ring light, bright, even",
        "motion": "energetic, jump cuts, transitions",
        "negative": "dark, moody, slow, boring",
    },
}

SHOT_TEMPLATES = {
    "opener": "Wide establishing shot of {subject}, {camera_style}, {color_grade}",
    "detail": "Extreme close-up of {detail}, {lighting}, shallow depth of field, {color_grade}",
    "action": "Medium shot of {subject} {action}, {motion}, {camera_style}",
    "reveal": "Slow push-in revealing {subject}, dramatic {lighting}, {color_grade}",
    "group": "Wide shot of {subjects} together, {camera_style}, community energy, {lighting}",
    "transition": "Abstract {motion} transition, {color_grade}, light leaks",
    "title_card": "Dark background with subtle particles, space for text overlay",
    "closer": "Pull-back wide shot of {subject}, {lighting}, fade to black, {color_grade}",
}


class StoryboardEngine:
    def __init__(self):
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    def create_storyboard(self, concept: str, style: str = "cinematic",
                          target_duration: int = 30) -> dict:
        if self.anthropic_key:
            return self._create_with_claude(concept, style, target_duration)
        else:
            return self._create_from_templates(concept, style, target_duration)

    def _create_with_claude(self, concept: str, style: str, target_duration: int) -> dict:
        style_config = STYLE_PRESETS.get(style, STYLE_PRESETS["cinematic"])
        num_shots = max(3, target_duration // 5)

        system_prompt = f"""You are a cinematic video director AI. Create shot-by-shot storyboards
for AI video generation. Each shot must have a detailed prompt that AI video generators can use directly.

Visual style: {json.dumps(style_config)}

Rules:
- Each shot should be 3-8 seconds
- Include camera movement in every prompt
- Maintain visual consistency (same lighting, color grade, subjects)
- Start with a hook, build energy, end with resolution
- Every prompt must be self-contained (the video AI has no memory between shots)
- Add the style keywords to every prompt for consistency
- Output ONLY valid JSON, no other text"""

        user_prompt = f"""Create a {target_duration}-second video storyboard for:

"{concept}"

Return JSON:
{{
  "title": "short title",
  "style": "{style}",
  "total_duration": {target_duration},
  "shots": [
    {{
      "id": 1,
      "description": "what happens in this shot",
      "duration": 5,
      "camera_work": "camera movement description",
      "generation_prompt": "FULL detailed prompt ready for AI video generation API",
      "transition": "cut/fade/flash"
    }}
  ]
}}

Create exactly {num_shots} shots totaling ~{target_duration} seconds."""

        try:
            with httpx.Client(timeout=60) as client:
                response = client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-sonnet-4-6-20250514",
                        "max_tokens": 4096,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    text = result["content"][0]["text"]
                    # Extract JSON from response
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0]
                    elif "```" in text:
                        text = text.split("```")[1].split("```")[0]
                    storyboard = json.loads(text.strip())
                    storyboard["generated_by"] = "claude"
                    storyboard["created_at"] = datetime.now().isoformat()
                    return storyboard
                else:
                    return self._create_from_templates(concept, style, target_duration)

        except Exception as e:
            return self._create_from_templates(concept, style, target_duration)

    def _create_from_templates(self, concept: str, style: str, target_duration: int) -> dict:
        style_config = STYLE_PRESETS.get(style, STYLE_PRESETS["cinematic"])
        num_shots = max(3, target_duration // 5)

        shot_types = ["opener", "action", "detail", "action", "group", "reveal", "closer"]
        if num_shots > len(shot_types):
            shot_types = shot_types * (num_shots // len(shot_types) + 1)
        shot_types = shot_types[:num_shots]

        shots = []
        duration_per_shot = target_duration / num_shots

        for i, shot_type in enumerate(shot_types):
            prompt_parts = [
                concept,
                style_config["camera_style"],
                style_config["color_grade"],
                style_config["lighting"],
            ]
            if i == 0 or i == len(shot_types) - 1:
                prompt_parts.append(style_config["motion"])

            generation_prompt = f"{concept}. {SHOT_TEMPLATES[shot_type].format(subject=concept, detail=concept, action='in motion', subjects=concept, **style_config)}. {style_config['color_grade']}. 4K cinematic quality."

            shots.append({
                "id": i + 1,
                "description": f"{shot_type.title()} shot of {concept}",
                "duration": round(duration_per_shot),
                "camera_work": style_config["camera_style"],
                "generation_prompt": generation_prompt,
                "negative_prompt": style_config["negative"],
                "transition": "fade" if i == len(shot_types) - 1 else "cut",
            })

        return {
            "title": concept[:50],
            "style": style,
            "total_duration": target_duration,
            "shots": shots,
            "generated_by": "template",
            "created_at": datetime.now().isoformat(),
        }
