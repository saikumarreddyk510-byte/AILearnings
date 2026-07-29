"""
Project data models for the LangGraph Trip Planner.
Telugu-English mix comments lo explain chestam.

Architecture:
- `TripRequest` = user travel details input
- `TripPlan` = generated itinerary + status + booking info
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class TripRequest:
    """User travel request data.

    origin: start city
    destination: destination city
    dates: travel dates string
    preferences: user preferences (culture, beach, relaxed pace)
    """

    origin: str
    destination: str
    dates: str
    preferences: str


@dataclass
class TripPlan:
    """Trip plan result structure.

    Itinerary, cost estimate, status, booking reference, and review notes.
    """

    itinerary: List[str]
    cost_estimate: str
    status: str = "draft"
    booking_reference: Optional[str] = None
    review_notes: Optional[str] = None

    def summary(self) -> str:
        """Return a readable summary of the trip plan."""
        items = "\n".join(f"- {item}" for item in self.itinerary)
        return (
            f"{items}\n"
            f"Cost estimate: {self.cost_estimate}\n"
            f"Booking reference: {self.booking_reference}\n"
            f"Status: {self.status}\n"
            f"Review notes: {self.review_notes}"
        )
