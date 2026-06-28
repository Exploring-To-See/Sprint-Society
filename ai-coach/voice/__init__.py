"""Headless text-to-speech for the one-way coach.

No Streamlit, no browser dependency — `synthesize(text, persona)` returns WAV
bytes that any frontend (web, mobile, server) can play or stream. The backend is
pluggable: Kokoro-82M (recommended, Apache-2.0, offline) when its model files are
present, else an offline pyttsx3/SAPI fallback, else a null backend.
"""

from voice.tts import (  # noqa: F401
    synthesize,
    synthesize_to_file,
    prerender_cue_stream,
    active_backend,
    PERSONA_VOICE,
)
