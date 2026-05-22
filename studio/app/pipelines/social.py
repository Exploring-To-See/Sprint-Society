"""
Social Media Publisher — Posts videos to Instagram, X/Twitter, YouTube, WhatsApp.
"""

import os
import json
import httpx
from pathlib import Path
from datetime import datetime


class SocialPublisher:
    def __init__(self):
        self.instagram_token = os.getenv("INSTAGRAM_TOKEN", "")
        self.twitter_api_key = os.getenv("TWITTER_API_KEY", "")
        self.twitter_api_secret = os.getenv("TWITTER_API_SECRET", "")
        self.twitter_access_token = os.getenv("TWITTER_ACCESS_TOKEN", "")
        self.twitter_access_secret = os.getenv("TWITTER_ACCESS_SECRET", "")
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")

    def publish(self, video_path: str, platforms: list, caption: str = "",
                hashtags: list = None) -> dict:
        results = {}
        hashtag_str = " ".join(f"#{h}" for h in (hashtags or []))
        full_caption = f"{caption}\n\n{hashtag_str}".strip()

        for platform in platforms:
            if platform == "instagram":
                results["instagram"] = self._post_instagram(video_path, full_caption)
            elif platform in ("twitter", "x"):
                results["twitter"] = self._post_twitter(video_path, full_caption)
            elif platform == "youtube":
                results["youtube"] = self._post_youtube(video_path, caption, hashtags)
            elif platform == "whatsapp":
                results["whatsapp"] = self._share_whatsapp(video_path, full_caption)
            else:
                results[platform] = {"status": "unsupported"}

        # Log publication
        self._log_publication(video_path, platforms, results)
        return results

    def _post_instagram(self, video_path: str, caption: str) -> dict:
        if not self.instagram_token:
            return {
                "status": "not_configured",
                "setup_url": "https://developers.facebook.com/docs/instagram-api/",
                "instructions": "1. Create Meta App → 2. Add Instagram Graph API → 3. Get long-lived token → 4. Add INSTAGRAM_TOKEN to .env",
            }

        try:
            with httpx.Client(timeout=60) as client:
                # Step 1: Create video container
                response = client.post(
                    "https://graph.facebook.com/v18.0/me/media",
                    params={
                        "access_token": self.instagram_token,
                        "media_type": "REELS",
                        "video_url": video_path,
                        "caption": caption,
                    },
                )
                if response.status_code == 200:
                    container_id = response.json().get("id")
                    # Step 2: Publish
                    pub_response = client.post(
                        "https://graph.facebook.com/v18.0/me/media_publish",
                        params={
                            "access_token": self.instagram_token,
                            "creation_id": container_id,
                        },
                    )
                    return {"status": "published", "id": pub_response.json().get("id")}
                return {"status": "error", "error": response.text[:200]}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _post_twitter(self, video_path: str, caption: str) -> dict:
        if not self.twitter_api_key:
            return {
                "status": "not_configured",
                "setup_url": "https://developer.twitter.com/en/portal/dashboard",
                "instructions": "1. Create Twitter App → 2. Get API keys → 3. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET to .env",
            }

        return {
            "status": "ready",
            "message": "Twitter/X API v2 requires OAuth 1.0a for media upload. Use tweepy library.",
            "manual_url": f"https://twitter.com/intent/tweet?text={caption[:200]}",
        }

    def _post_youtube(self, video_path: str, title: str, hashtags: list = None) -> dict:
        if not self.youtube_api_key:
            return {
                "status": "not_configured",
                "setup_url": "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
                "instructions": "1. Enable YouTube Data API v3 → 2. Create OAuth credentials → 3. Add YOUTUBE_API_KEY to .env",
            }

        return {
            "status": "ready",
            "message": "YouTube upload requires OAuth2 flow. Run 'python pipelines/youtube_upload.py' for interactive auth.",
        }

    def _share_whatsapp(self, video_path: str, caption: str) -> dict:
        return {
            "status": "manual",
            "message": "WhatsApp sharing opens the share dialog.",
            "share_url": f"https://api.whatsapp.com/send?text={caption[:500]}",
            "file_path": video_path,
        }

    def _log_publication(self, video_path: str, platforms: list, results: dict):
        log_dir = Path(__file__).parent.parent.parent / "output" / "publish_log"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / f"{datetime.now().strftime('%Y-%m-%d')}.json"

        logs = []
        if log_file.exists():
            logs = json.loads(log_file.read_text())

        logs.append({
            "timestamp": datetime.now().isoformat(),
            "video": video_path,
            "platforms": platforms,
            "results": results,
        })

        log_file.write_text(json.dumps(logs, indent=2))

    def get_platform_status(self) -> dict:
        return {
            "instagram": "configured" if self.instagram_token else "not_configured",
            "twitter": "configured" if self.twitter_api_key else "not_configured",
            "youtube": "configured" if self.youtube_api_key else "not_configured",
            "whatsapp": "always_available",
        }
