"""
fal.ai Video Generator — Primary provider for Kendu Studio.
Models: Wan2.1, Kling, CogVideoX, Hunyuan, LTX-Video
"""

import os
import time
import httpx
from pathlib import Path


FAL_MODELS = {
    "wan2.1": "fal-ai/wan/v2.1",
    "wan2.1-1.3b": "fal-ai/wan/v2.1/1.3b",
    "kling": "fal-ai/kling-video/v2/master",
    "kling-pro": "fal-ai/kling-video/v2/master/pro",
    "cogvideo": "fal-ai/cogvideox-5b",
    "hunyuan": "fal-ai/hunyuan-video",
    "ltx": "fal-ai/ltx-video/v0.9.5",
    "minimax": "fal-ai/minimax/video-01",
    "luma": "fal-ai/luma-dream-machine",
}

ASPECT_RATIOS = {
    "9:16": {"width": 720, "height": 1280},
    "16:9": {"width": 1280, "height": 720},
    "1:1": {"width": 1024, "height": 1024},
}


class FalGenerator:
    def __init__(self):
        self.api_key = os.getenv("FAL_KEY", "")
        self.base_url = "https://queue.fal.run"

    def generate(self, prompt: str, duration: int = 5, aspect_ratio: str = "9:16",
                 model: str = "wan2.1", image_url: str = None, negative_prompt: str = "") -> dict:
        if not self.api_key:
            return {"status": "error", "error": "FAL_KEY not set. Add it in Settings."}

        model_id = FAL_MODELS.get(model, model)
        dims = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])

        payload = {
            "prompt": prompt,
            "num_frames": min(duration * 8, 81),
            "resolution": dims,
            "aspect_ratio": aspect_ratio,
        }

        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if image_url:
            payload["image_url"] = image_url

        # Model-specific adjustments
        if "kling" in model:
            payload = {
                "prompt": prompt,
                "duration": str(min(duration, 10)),
                "aspect_ratio": aspect_ratio,
            }
        elif "minimax" in model:
            payload = {
                "prompt": prompt,
            }
        elif "luma" in model:
            payload = {
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "loop": False,
            }

        try:
            # Submit job
            with httpx.Client(timeout=30) as client:
                response = client.post(
                    f"{self.base_url}/{model_id}",
                    headers={
                        "Authorization": f"Key {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if response.status_code == 200:
                    result = response.json()
                    video_url = None
                    if "video" in result:
                        video_url = result["video"].get("url") if isinstance(result["video"], dict) else result["video"]
                    elif "output" in result:
                        video_url = result["output"].get("url") if isinstance(result["output"], dict) else result["output"]

                    return {
                        "status": "completed" if video_url else "processing",
                        "url": video_url,
                        "request_id": result.get("request_id"),
                        "provider": "fal",
                        "model": model,
                    }

                elif response.status_code == 202:
                    result = response.json()
                    return {
                        "status": "queued",
                        "request_id": result.get("request_id"),
                        "status_url": result.get("status_url"),
                        "provider": "fal",
                        "model": model,
                    }

                else:
                    return {
                        "status": "error",
                        "error": f"API returned {response.status_code}: {response.text[:200]}",
                        "provider": "fal",
                    }

        except Exception as e:
            return {"status": "error", "error": str(e), "provider": "fal"}

    def poll_status(self, request_id: str, model: str = "wan2.1") -> dict:
        model_id = FAL_MODELS.get(model, model)
        try:
            with httpx.Client(timeout=30) as client:
                response = client.get(
                    f"{self.base_url}/{model_id}/requests/{request_id}/status",
                    headers={"Authorization": f"Key {self.api_key}"},
                )
                if response.status_code == 200:
                    return response.json()
                return {"status": "unknown", "error": response.text}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def get_result(self, request_id: str, model: str = "wan2.1") -> dict:
        model_id = FAL_MODELS.get(model, model)
        try:
            with httpx.Client(timeout=60) as client:
                response = client.get(
                    f"https://queue.fal.run/{model_id}/requests/{request_id}",
                    headers={"Authorization": f"Key {self.api_key}"},
                )
                if response.status_code == 200:
                    result = response.json()
                    video_url = None
                    if "video" in result:
                        video_url = result["video"].get("url") if isinstance(result["video"], dict) else result["video"]
                    return {"status": "completed", "url": video_url, "raw": result}
                return {"status": "pending"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def list_models(self) -> list:
        return [{"id": k, "fal_id": v} for k, v in FAL_MODELS.items()]
