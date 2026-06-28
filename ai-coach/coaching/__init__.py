"""Per-coach training cycles (10 levels each) and progression logic."""

from coaching.cycles import (
    COACH_CYCLES,
    get_cycle,
    get_level,
    level_block_for_prompt,
    estimate_starting_level,
)

__all__ = [
    "COACH_CYCLES",
    "get_cycle",
    "get_level",
    "level_block_for_prompt",
    "estimate_starting_level",
]
