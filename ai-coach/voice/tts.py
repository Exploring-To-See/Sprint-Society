"""Headless, pluggable text-to-speech for the one-way coach.

Why this exists: the coach must speak (pre-run brief, during-run cues, post-run
recap) but the repo is being shipped as a *library* into a real app with its own
frontend — so there is NO Streamlit/browser here. This module turns coach text
into WAV bytes through a swappable backend, so the host app can play/stream the
audio however it likes.

Backend priority (auto-detected):
  1. Kokoro-82M (kokoro-onnx)  — recommended: Apache-2.0, offline, high quality,
     distinct per-persona voices. Active when the model files are present.
  2. pyttsx3 (offline OS voices) — always-available dev/fallback path.
  3. null — returns None (text-only); never crashes the caller.

All imports of optional engines are lazy, so `import voice.tts` always succeeds
even when no TTS engine is installed.
"""

from __future__ import annotations

import hashlib
import io
import os
import wave
from typing import List, Optional, Tuple


# Per-persona voice identity. Kokoro voice ids are real Kokoro v1.0 speakers;
# `speed` shapes the delivery (energizer brisk, sage unhurried). pyttsx3 `rate`
# (words/min) and `voice_rank` give the fallback engine per-persona contrast.
PERSONA_VOICE = {
    "scientist": {"kokoro": "am_michael", "speed": 1.00, "rate": 168, "voice_rank": 0},
    "energizer": {"kokoro": "af_bella",   "speed": 1.12, "rate": 200, "voice_rank": 1},
    "warrior":   {"kokoro": "am_fenrir",  "speed": 1.02, "rate": 186, "voice_rank": 0},
    "sage":      {"kokoro": "bm_george",  "speed": 0.90, "rate": 150, "voice_rank": 1},
}
_DEFAULT_PERSONA = "energizer"

# Where Kokoro model files live (overridable via env for the host app).
_KOKORO_MODEL = os.environ.get("KOKORO_MODEL_PATH", os.path.join("models", "kokoro-v1.0.onnx"))
_KOKORO_VOICES = os.environ.get("KOKORO_VOICES_PATH", os.path.join("models", "voices-v1.0.bin"))


def _persona_cfg(persona: str) -> dict:
    return PERSONA_VOICE.get(persona, PERSONA_VOICE[_DEFAULT_PERSONA])


# --------------------------------------------------------------------------- #
# Backends
# --------------------------------------------------------------------------- #
class _KokoroBackend:
    name = "kokoro"

    def __init__(self):
        from kokoro_onnx import Kokoro  # lazy
        self._k = Kokoro(_KOKORO_MODEL, _KOKORO_VOICES)

    @staticmethod
    def available() -> bool:
        if not (os.path.exists(_KOKORO_MODEL) and os.path.exists(_KOKORO_VOICES)):
            return False
        try:
            import kokoro_onnx  # noqa: F401
            return True
        except Exception:
            return False

    def synthesize(self, text: str, persona: str) -> Optional[bytes]:
        cfg = _persona_cfg(persona)
        samples, sr = self._k.create(text, voice=cfg["kokoro"], speed=cfg["speed"], lang="en-us")
        return _float_samples_to_wav_bytes(samples, sr)


class _Pyttsx3Backend:
    name = "pyttsx3"

    @staticmethod
    def available() -> bool:
        try:
            import pyttsx3  # noqa: F401
            return True
        except Exception:
            return False

    def synthesize(self, text: str, persona: str) -> Optional[bytes]:
        import tempfile
        import pyttsx3
        cfg = _persona_cfg(persona)
        engine = pyttsx3.init()
        engine.setProperty("rate", cfg["rate"])
        voices = engine.getProperty("voices") or []
        if voices:
            engine.setProperty("voice", voices[cfg["voice_rank"] % len(voices)].id)
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.close()
        try:
            engine.save_to_file(text, tmp.name)
            engine.runAndWait()
            with open(tmp.name, "rb") as f:
                return f.read()
        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass


class _NullBackend:
    name = "null"

    @staticmethod
    def available() -> bool:
        return True

    def synthesize(self, text: str, persona: str) -> Optional[bytes]:
        return None


_BACKEND = None


def _select_backend():
    global _BACKEND
    if _BACKEND is not None:
        return _BACKEND
    forced = os.environ.get("COACH_TTS_BACKEND")  # 'kokoro'|'pyttsx3'|'null'
    order = {
        "kokoro": [_KokoroBackend, _Pyttsx3Backend, _NullBackend],
        "pyttsx3": [_Pyttsx3Backend, _NullBackend],
        "null": [_NullBackend],
    }.get(forced, [_KokoroBackend, _Pyttsx3Backend, _NullBackend])
    for cls in order:
        try:
            if cls.available():
                _BACKEND = cls()
                return _BACKEND
        except Exception:
            continue
    _BACKEND = _NullBackend()
    return _BACKEND


def active_backend() -> str:
    return _select_backend().name


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def synthesize(text: str, persona: str = _DEFAULT_PERSONA) -> Optional[bytes]:
    """Return WAV bytes for `text` in `persona`'s voice, or None if no engine."""
    if not text:
        return None
    return _select_backend().synthesize(text, persona)


def synthesize_to_file(text: str, persona: str, path: str) -> Optional[str]:
    data = synthesize(text, persona)
    if data is None:
        return None
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return path


def prerender_cue_stream(stream: List[Tuple[float, str]], persona: str,
                         outdir: str = os.path.join("data", "audio")) -> List[dict]:
    """Pre-generate audio for a whole cue stream, cached by content hash so the
    same line is never synthesized twice. Returns [{t_s, text, audio_path}]; the
    real app can preload/queue these and fire them at their timestamps.

    Caching by hash honors the cost ceiling — identical cues reuse one file.
    """
    os.makedirs(outdir, exist_ok=True)
    out = []
    for t_s, text in stream:
        h = hashlib.sha256(f"{persona}|{text}".encode("utf-8")).hexdigest()[:16]
        path = os.path.join(outdir, f"{persona}_{h}.wav")
        if not os.path.exists(path):
            synthesize_to_file(text, persona, path)
        out.append({"t_s": t_s, "text": text, "audio_path": path if os.path.exists(path) else None})
    return out


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _float_samples_to_wav_bytes(samples, sample_rate: int) -> bytes:
    """Convert float32 [-1,1] samples (numpy array or list) to 16-bit PCM WAV bytes."""
    try:
        import numpy as np
        arr = np.asarray(samples, dtype="float32")
        arr = np.clip(arr, -1.0, 1.0)
        pcm = (arr * 32767.0).astype("<i2").tobytes()
    except Exception:
        # pure-python fallback
        pcm = b"".join(
            int(max(-1.0, min(1.0, s)) * 32767).to_bytes(2, "little", signed=True)
            for s in samples
        )
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(int(sample_rate))
        w.writeframes(pcm)
    return buf.getvalue()
