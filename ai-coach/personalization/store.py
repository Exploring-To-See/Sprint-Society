"""Per-user JSON / JSONL personalization store.

Layout (one folder per user)::

    data/personalization/<user_id>/
        profile.json          # latest snapshot of the structured profile
        personalization.json  # evolving model the coach reads every turn
        events.jsonl          # append-only log of every interaction
        training_log.jsonl    # runs the user reports

The personalization model is updated on *every* user message via
:func:`update_from_message`, so the coaches adapt continuously.
"""

import json
import os
import threading
from datetime import datetime, timezone

from config import PERSONALIZATION_DIR
from personalization.extractor import extract_signals

_LOCK = threading.Lock()

MAX_TREND_POINTS = 50
MAX_RECENT_EVENTS = 200


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


class PersonalizationStore:
    def __init__(self, base_dir: str = PERSONALIZATION_DIR):
        self.base_dir = base_dir

    # ------------------------------------------------------------------ paths
    def _user_dir(self, user_id: int) -> str:
        path = os.path.join(self.base_dir, str(user_id))
        os.makedirs(path, exist_ok=True)
        return path

    def _file(self, user_id: int, name: str) -> str:
        return os.path.join(self._user_dir(user_id), name)

    # ------------------------------------------------------------- low level
    def _read_json(self, path: str, default):
        if not os.path.exists(path):
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default

    def _write_json(self, path: str, data) -> None:
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)

    def _append_jsonl(self, path: str, record: dict) -> None:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def _read_jsonl(self, path: str, limit: int | None = None) -> list[dict]:
        if not os.path.exists(path):
            return []
        rows: list[dict] = []
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        rows.append(json.loads(line))
        except Exception:
            return rows
        if limit is not None:
            return rows[-limit:]
        return rows

    # ------------------------------------------------------------ defaults
    def _default_personalization(self, user_id: int) -> dict:
        return {
            "user_id": user_id,
            "created_at": _now(),
            "updated_at": _now(),
            "last_active": _now(),
            "interaction_count": 0,
            "goals": [],            # [{text, first_seen, last_seen, mentions}]
            "achievements": [],     # [{text, ts}]
            "injuries": [],         # [{area, status, first_seen, last_seen, mentions}]
            "preferences": {"likes": [], "dislikes": []},
            "motivation_drivers": [],
            "topics": {},           # topic -> count
            "sentiment_trend": [],  # [{ts, sentiment}]
            "mileage_mentions": [],  # [{ts, km}]
            "coaching_adjustments": {
                "wants_data": False,
                "needs_encouragement": False,
                "prefers_brevity": False,
            },
            "summary": "",
        }

    # --------------------------------------------------------------- public
    def get_personalization(self, user_id: int) -> dict:
        path = self._file(user_id, "personalization.json")
        data = self._read_json(path, None)
        if data is None:
            data = self._default_personalization(user_id)
            self._write_json(path, data)
        return data

    def sync_profile(self, user_id: int, profile: dict) -> None:
        """Persist a snapshot of the structured DB profile as JSON."""
        if not profile:
            return
        snapshot = {k: v for k, v in profile.items() if k != "id"}
        snapshot["_synced_at"] = _now()
        self._write_json(self._file(user_id, "profile.json"), snapshot)
        self.log_event(user_id, "profile_update", {"tier": profile.get("tier")})

    def log_event(self, user_id: int, event_type: str, payload: dict | None = None) -> None:
        record = {"ts": _now(), "type": event_type, "payload": payload or {}}
        with _LOCK:
            self._append_jsonl(self._file(user_id, "events.jsonl"), record)

    def get_events(self, user_id: int, limit: int = MAX_RECENT_EVENTS) -> list[dict]:
        return self._read_jsonl(self._file(user_id, "events.jsonl"), limit=limit)

    # ----------------------------------------------------------- training log
    def add_training_log(self, user_id: int, entry: dict, thread_id: int | None = None) -> None:
        record = {"ts": _now(), "date": entry.get("date", _today()), "thread_id": thread_id, **entry}
        with _LOCK:
            self._append_jsonl(self._file(user_id, "training_log.jsonl"), record)
        self.log_event(user_id, "training_log", {"distance_km": entry.get("distance_km"), "thread_id": thread_id})
        
        # Trigger live ML/DL performance and safety analysis
        try:
            from engine.ml_models import ml_dl_engine
            ml_dl_engine.analyze_runner(user_id)
        except Exception:
            pass

    def get_training_log(self, user_id: int, limit: int | None = None) -> list[dict]:
        return self._read_jsonl(self._file(user_id, "training_log.jsonl"), limit=limit)

    # ------------------------------------------------- per-coach level (1-10)
    def get_training_level(self, user_id: int, coach_style: str, default: int = 1) -> int:
        """Current level on the active coach's cycle. Resets sensibly if the
        runner switched coaches (each coach has its own cycle)."""
        with _LOCK:
            data = self.get_personalization(user_id)
            tl = data.get("training_level")
            if not tl or tl.get("coach") != coach_style:
                tl = {"coach": coach_style, "level": int(default), "history": []}
                data["training_level"] = tl
                self._write_json(self._file(user_id, "personalization.json"), data)
            return int(tl.get("level", default))

    def set_training_level(self, user_id: int, coach_style: str, level: int, reason: str = "") -> int:
        level = max(1, min(10, int(level)))
        with _LOCK:
            data = self.get_personalization(user_id)
            tl = data.get("training_level") or {"coach": coach_style, "level": level, "history": []}
            tl["coach"] = coach_style
            prev = tl.get("level")
            tl["level"] = level
            tl.setdefault("history", []).append({"ts": _now(), "level": level, "reason": reason})
            tl["history"] = tl["history"][-30:]
            data["training_level"] = tl
            self._write_json(self._file(user_id, "personalization.json"), data)
        self.log_event(user_id, "level_change", {"coach": coach_style, "from": prev, "to": level, "reason": reason[:120]})
        return level

    # ------------------------------------------------- continuous self-update
    def update_from_message(self, user_id: int, text: str, role: str = "user", thread_id: int | None = None) -> dict:
        """Extract signals from a message and merge them into the model.

        Returns the updated personalization dict. Called on every turn.
        """
        signals = extract_signals(text or "")
        with _LOCK:
            data = self.get_personalization(user_id)
            now = _now()
            data["updated_at"] = now
            data["last_active"] = now
            if role == "user":
                data["interaction_count"] = data.get("interaction_count", 0) + 1

            # Goals -------------------------------------------------------
            for g in signals.get("goals", []):
                self._upsert_named(data["goals"], g, now)

            # Achievements ------------------------------------------------
            for a in signals.get("achievements", []):
                if not any(x["text"].lower() == a.lower() for x in data["achievements"]):
                    data["achievements"].append({"text": a, "ts": now})

            # Injuries (with recovery lifecycle support) -----------------
            for inj in signals.get("injuries", []):
                area = inj.get("area")
                status = inj.get("status", "active")
                if not area:
                    continue

                existing = next((i for i in data["injuries"] if i["area"] == area), None)
                if existing:
                    existing["last_seen"] = now
                    existing["mentions"] = existing.get("mentions", 1) + 1
                    existing["status"] = status
                else:
                    data["injuries"].append({
                        "area": area, 
                        "status": status,
                        "first_seen": now, 
                        "last_seen": now, 
                        "mentions": 1,
                    })

            # Preferences -------------------------------------------------
            for pref in signals.get("preferences", []):
                kind = pref.get("kind")
                val = pref.get("value")
                if kind and val:
                    bucket = "likes" if kind == "like" else "dislikes"
                    if val.lower() not in [v.lower() for v in data["preferences"][bucket]]:
                        data["preferences"][bucket].append(val)

            # Topics ------------------------------------------------------
            for t in signals.get("topics", []):
                data["topics"][t] = data["topics"].get(t, 0) + 1

            # Sentiment trend --------------------------------------------
            if role == "user":
                data["sentiment_trend"].append({"ts": now, "sentiment": signals.get("sentiment", "neutral")})
                data["sentiment_trend"] = data["sentiment_trend"][-MAX_TREND_POINTS:]

            # Mileage -----------------------------------------------------
            for km in signals.get("mileage", []):
                data["mileage_mentions"].append({"ts": now, "km": km})
            data["mileage_mentions"] = data["mileage_mentions"][-MAX_TREND_POINTS:]

            # Derived coaching adjustments -------------------------------
            self._derive_adjustments(data)
            data["summary"] = self._build_summary(data)

            self._write_json(self._file(user_id, "personalization.json"), data)

        # Log the raw message as an event (outside the model lock section is fine).
        self.log_event(user_id, f"{role}_message", {
            "preview": (text or "")[:160],
            "sentiment": signals.get("sentiment"),
            "topics": signals.get("topics"),
            "thread_id": thread_id,
        })
        return data

    # --------------------------------------------------------------- helpers
    def _upsert_named(self, items: list[dict], text: str, now: str) -> None:
        low = text.lower()
        for x in items:
            xl = x["text"].lower()
            # Treat substring-overlapping phrases as the same goal.
            if xl == low or xl in low or low in xl:
                x["last_seen"] = now
                x["mentions"] = x.get("mentions", 1) + 1
                # Prefer the longer, more descriptive phrasing.
                if len(text) > len(x["text"]):
                    x["text"] = text
                return
        items.append({"text": text, "first_seen": now, "last_seen": now, "mentions": 1})

    def _derive_adjustments(self, data: dict) -> None:
        topics = data.get("topics", {})
        trend = [s["sentiment"] for s in data.get("sentiment_trend", [])[-6:]]
        adj = data.setdefault("coaching_adjustments", {})
        adj["wants_data"] = topics.get("pacing", 0) + topics.get("training_plan", 0) >= 3
        adj["needs_encouragement"] = trend.count("negative") >= 2
        active_injuries = [i for i in data.get("injuries", []) if i.get("status") == "active"]
        adj["has_active_injury"] = bool(active_injuries)
        # Motivation drivers from recurring positive topics.
        drivers = data.setdefault("motivation_drivers", [])
        for topic, count in topics.items():
            if count >= 3 and topic in ("racing", "motivation", "strength") and topic not in drivers:
                drivers.append(topic)

    def _build_summary(self, data: dict) -> str:
        parts = []
        goals = [g["text"] for g in data.get("goals", [])][:3]
        if goals:
            parts.append("Goals: " + "; ".join(goals))
        active = [i["area"] for i in data.get("injuries", []) if i.get("status") == "active"]
        if active:
            parts.append("Active niggles: " + ", ".join(active))
        likes = data.get("preferences", {}).get("likes", [])[:3]
        if likes:
            parts.append("Enjoys: " + ", ".join(likes))
        top_topics = sorted(data.get("topics", {}).items(), key=lambda kv: kv[1], reverse=True)[:3]
        if top_topics:
            parts.append("Often discusses: " + ", ".join(t for t, _ in top_topics))
        return " | ".join(parts)

    # ------------------------------------------------- prompt-facing summary
    def build_prompt_block(self, user_id: int) -> str:
        """A compact, human-readable block injected into the system prompt."""
        data = self.get_personalization(user_id)
        lines = []
        if data.get("summary"):
            lines.append(data["summary"])
            
        # Inject ML + DL predictive analytics directly into coach prompt context
        ml_dl = data.get("ml_dl_performance_analysis")
        if ml_dl:
            lines.append(
                f"ML/DL Predictions: injury risk = {ml_dl.get('injury_risk_percent')}% "
                f"({ml_dl.get('readiness_zone')} readiness), predicted VDOT next week = {ml_dl.get('predicted_future_vdot')}"
            )
        adj = data.get("coaching_adjustments", {})
        notes = []
        if adj.get("has_active_injury"):
            notes.append("has an active injury/niggle - prioritise safety")
        if adj.get("needs_encouragement"):
            notes.append("recent mood has been low — be extra encouraging")
        if adj.get("wants_data"):
            notes.append("responds well to specific numbers and structured plans")
        if notes:
            lines.append("Coaching cues: " + "; ".join(notes) + ".")
        log = self.get_training_log(user_id, limit=3)
        if log:
            recent = ", ".join(
                f"{e.get('date','?')}: {e.get('distance_km','?')}km {e.get('type','run')}"
                for e in log
            )
            lines.append("Recent logged runs: " + recent + ".")
        if not lines:
            return ""
        return "CONTINUOUS PERSONALIZATION (learned from past chats):\n" + "\n".join(f"- {l}" for l in lines)

    def delete_thread_data(self, user_id: int, thread_id: int) -> None:
        """
        Deletes all logged events and training log entries associated with thread_id
        from the local JSONL files, then rebuilds personalization.json from the
        remaining conversations and training logs.
        """
        with _LOCK:
            # 1. Clean training_log.jsonl
            log_path = self._file(user_id, "training_log.jsonl")
            remaining_runs = []
            if os.path.exists(log_path):
                runs = self._read_jsonl(log_path)
                for run in runs:
                    if run.get("thread_id") != thread_id:
                        remaining_runs.append(run)
                
                # Rewrite file
                tmp = log_path + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    for run in remaining_runs:
                        f.write(json.dumps(run, ensure_ascii=False) + "\n")
                os.replace(tmp, log_path)

            # 2. Clean events.jsonl
            events_path = self._file(user_id, "events.jsonl")
            remaining_events = []
            if os.path.exists(events_path):
                events = self._read_jsonl(events_path)
                for ev in events:
                    payload = ev.get("payload", {})
                    if payload.get("thread_id") != thread_id:
                        remaining_events.append(ev)
                
                # Rewrite file
                tmp = events_path + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    for ev in remaining_events:
                        f.write(json.dumps(ev, ensure_ascii=False) + "\n")
                os.replace(tmp, events_path)

            # 3. Reset personalization.json
            pers_path = self._file(user_id, "personalization.json")
            data = self._default_personalization(user_id)
            
            # 4. Reconstruct personalization.json from remaining SQLite chat history
            try:
                from database.models import get_connection
                conn = get_connection()
                rows = conn.execute(
                    "SELECT role, content FROM conversations WHERE user_id = ? ORDER BY created_at ASC",
                    (user_id,)
                ).fetchall()
                conn.close()
            except Exception:
                rows = []
            
            now = _now()
            data["updated_at"] = now
            for row in rows:
                role = row["role"]
                text = row["content"]
                
                from personalization.extractor import extract_signals
                signals = extract_signals(text or "")
                
                if role == "user":
                    data["interaction_count"] = data.get("interaction_count", 0) + 1
                    data["sentiment_trend"].append({"ts": now, "sentiment": signals.get("sentiment", "neutral")})
                    data["sentiment_trend"] = data["sentiment_trend"][-MAX_TREND_POINTS:]
                
                for g in signals.get("goals", []):
                    self._upsert_named(data["goals"], g, now)
                for a in signals.get("achievements", []):
                    if not any(x["text"].lower() == a.lower() for x in data["achievements"]):
                        data["achievements"].append({"text": a, "ts": now})
                for inj in signals.get("injuries", []):
                    area = inj.get("area")
                    status = inj.get("status", "active")
                    if area:
                        existing = next((i for i in data["injuries"] if i["area"] == area), None)
                        if existing:
                            existing["last_seen"] = now
                            existing["mentions"] = existing.get("mentions", 1) + 1
                            existing["status"] = status
                        else:
                            data["injuries"].append({
                                "area": area, 
                                "status": status,
                                "first_seen": now, 
                                "last_seen": now, 
                                "mentions": 1,
                            })
                for pref in signals.get("preferences", []):
                    kind = pref.get("kind")
                    val = pref.get("value")
                    if kind and val:
                        bucket = "likes" if kind == "like" else "dislikes"
                        if val.lower() not in [v.lower() for v in data["preferences"][bucket]]:
                            data["preferences"][bucket].append(val)
                for t in signals.get("topics", []):
                    data["topics"][t] = data["topics"].get(t, 0) + 1
                for km in signals.get("mileage", []):
                    data["mileage_mentions"].append({"ts": now, "km": km})
                data["mileage_mentions"] = data["mileage_mentions"][-MAX_TREND_POINTS:]

            self._derive_adjustments(data)
            data["summary"] = self._build_summary(data)
            
            # Re-run ML/DL predictions
            try:
                from engine.ml_models import ml_dl_engine
                analysis = ml_dl_engine.analyze_runner(user_id)
                data["ml_dl_performance_analysis"] = analysis
            except Exception:
                pass
                
            self._write_json(pers_path, data)

    def get_active_plan(self, user_id: int) -> dict | None:
        path = self._file(user_id, "active_plan.json")
        return self._read_json(path, None)

    def save_active_plan(self, user_id: int, plan_data: dict) -> None:
        path = self._file(user_id, "active_plan.json")
        self._write_json(path, plan_data)
        self.log_event(user_id, "plan_updated", {"goal": plan_data.get("goal")})

    def complete_workout(self, user_id: int, workout_id: str, logged_run: dict, thread_id: int | None = None) -> dict | None:
        plan = self.get_active_plan(user_id)
        if not plan:
            return None
            
        updated = False
        for week in plan.get("weeks", []):
            for workout in week.get("schedule", []):
                if workout.get("id") == workout_id:
                    workout["status"] = "completed"
                    workout["logged_run"] = {
                        "ts": _now(),
                        "distance_km": logged_run.get("distance_km"),
                        "duration_minutes": logged_run.get("duration_minutes"),
                        "feel": logged_run.get("feel"),
                        "notes": logged_run.get("notes"),
                    }
                    updated = True
                    break
            if updated:
                break
                
        if updated:
            self.save_active_plan(user_id, plan)
            self.add_training_log(user_id, logged_run, thread_id=thread_id)
            return plan
        return None


store = PersonalizationStore()
