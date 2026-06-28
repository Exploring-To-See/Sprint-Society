"""Local JSON/JSONL personalization layer.

Every user input and coaching reply is captured here so the AI coaches can
adapt continuously. State lives in plain JSON / JSONL files under
``data/personalization/<user_id>/`` so it is easy to inspect, back up, and
reflect directly in the Streamlit UI.
"""

from personalization.store import (
    PersonalizationStore,
    store as personalization_store,
)

__all__ = ["PersonalizationStore", "personalization_store"]
