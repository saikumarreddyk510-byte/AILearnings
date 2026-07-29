"""
LangGraph workflow graph representation.

This module stores the workflow nodes and edges that describe the
logical LangGraph flow between agents.
"""

from typing import Dict, List, Tuple


class LangGraphModel:
    """Simple in-memory LangGraph representation."""

    def __init__(self) -> None:
        # Node id to description mapping.
        self.nodes: Dict[str, str] = {}
        # Edge list, each edge is (source, target).
        self.edges: List[Tuple[str, str]] = []

    def add_node(self, node_id: str, description: str) -> None:
        """Add a node to the graph with descriptive text."""
        self.nodes[node_id] = description

    def add_edge(self, source: str, target: str) -> None:
        """Connect two workflow nodes with a directed edge."""
        self.edges.append((source, target))

    def describe(self) -> str:
        """Return a human-readable description of the workflow graph."""
        description = ["LangGraph workflow graph:"]
        for node_id, node_label in self.nodes.items():
            description.append(f"- {node_id}: {node_label}")
        for source, target in self.edges:
            description.append(f"  {source} -> {target}")
        return "\n".join(description)

    def to_dict(self) -> Dict[str, List[Tuple[str, str]]]:
        """Return the graph as a dictionary for debugging or export."""
        return {"nodes": list(self.nodes.items()), "edges": self.edges}
