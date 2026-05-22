"""
Replicate Video Generator — Secondary provider for Kendu Studio.
Models: Wan2.1, CogVideoX, Mochi, LTX-Video
"""

import os
import time
import httpx


REPLICATE_MODELS = {
    "wan2.1": "wan-video/wan2.1-t2v-720p",
    "wan2.1-i2v": "wan-video/wan2.1-i2v-720p",
    "cogvideo": "THUDM/CogVideoX-5b",
    "mochi": "genmoai/mochi-1-preview",
    "ltx": "lightricks/ltx-video",
    "animate-diff": "lucataco/animate-diff",
}


class ReplicateGenerator:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN", "")
        self.base_url = "https://api.replicate.com/v1"

    def generate(self, prompt: str, duration: int = 5, aspect_ratio: str = "9:16",
                 model: str = "wan2.1", image_url: str = None) -> dict:
        if not self.api_token:
            return {"status": "error", "error": "REPLICATE_API_TOKEN not set. Add it in Settings."}

        model_id = REPLICATE_MODELS.get(model, model)

        # Build input based on model
        input_data = {"prompt": prompt}

        if "wan" in model:
            input_data.update({
                "num_frames": min(duration * 16, 81),
                "aspect_ratio": aspect_ratio.replace(":", "x"),
            })
        elif "cog" in model:
            input_data.update({
                "num_frames": min(duration * 8, 48),
                "guidance_scale": 7.5,
            })

        if image_url:
            input_data["image"] = image_url

        try:
            with httpx.Client(timeout=30) as client:
                # Create prediction
                response = client.post(
                    f"{self.base_url}/predictions",
                    headers={
                        "Authorization": f"Bearer {self.api_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_id,
                        "input": input_data,
                    },
                )

                if response.status_code in (200, 201):
                    result = response.json()
                    return {
                        "status": "submitted",
                        "prediction_id": result.get("id"),
                        "url": result.get("urls", {}).get("get"),
                        "provider": "replicate",
                        "model": model,
                    }
                else:
                    return {
                        "status": "error",
                        "error": f"API returned {response.status_code}: {response.text[:200]}",
                        "provider": "replicate",
                    }

        except Exception as e:
            return {"status": "error", "error": str(e), "provider": "replicate"}

    def poll_status(self, prediction_id: str) -> dict:
        try:
            with httpx.Client(timeout=30) as client:
                response = client.get(
                    f"{self.base_url}/predictions/{prediction_id}",
                    headers={"Authorization": f"Bearer {self.api_token}"},
                )
                if response.status_code == 200:
                    result = response.json()
                    status = result.get("status")
                    output = result.get("output")
                    video_url = None
                    if output:
                        video_url = output[0] if isinstance(output, list) else output
                    return {
                        "status": status,
                        "url": video_url,
                        "logs": result.get("logs", ""),
                    }
                return {"status": "unknown"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def list_models(self) -> list:
        return [{"id": k, "replicate_id": v} for k, v in REPLICATE_MODELS.items()]
