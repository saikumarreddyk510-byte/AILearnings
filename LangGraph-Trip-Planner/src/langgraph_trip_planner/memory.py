"""
Memory store for LangGraph trip planner.

This module keeps an ordered log of workflow stages and notes.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class MemoryEntry:
    """A single memory entry for a workflow step."""
    step: str
    content: str


class MemoryStore:
    """In-memory workflow memory log."""

    def __init__(self) -> None:
        """Initialize an empty list of memory entries."""
        self.entries: List[MemoryEntry] = []

    def add(self, step: str, content: str) -> None:
        """Append a memory entry after a workflow stage completes."""
        self.entries.append(MemoryEntry(step=step, content=content))

    def get_by_step(self, step: str) -> List[str]:
        """Return the logged content for the given workflow step."""
        return [entry.content for entry in self.entries if entry.step == step]

    def summary(self) -> str:
        """Return a readable summary of all memory entries."""
        lines = [f"{entry.step}: {entry.content}" for entry in self.entries]
        return "\n".join(lines)

    def last(self) -> str:
        """Return the most recent memory entry if one exists."""
        if not self.entries:
            return "No memory yet."
        return self.entries[-1].content
