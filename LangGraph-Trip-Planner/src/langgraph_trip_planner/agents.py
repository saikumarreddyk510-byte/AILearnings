"""
Agents for LangGraph Trip Planner.

Each agent implements one step of the workflow:
- PlannerAgent creates the itinerary.
- BookingAgent attaches booking metadata.
- ReviewAgent inspects the plan quality.
- HumanAgent refines the plan after user feedback.
"""

from .models import TripPlan, TripRequest


class PlannerAgent:
    """Planner agent creates the first candidate trip plan."""

    def plan(self, request: TripRequest) -> TripPlan:
        """Generate a draft itinerary from the user request."""
        itinerary = [
            f"Day 1: arrive in {request.destination} from {request.origin}",
            f"Day 2: explore {request.destination} based on preferences: {request.preferences}",
            "Day 3: flexible adventure or rest day",
            "Day 4: return home",
        ]
        cost_estimate = "Approx. $1,700 USD"
        return TripPlan(itinerary=itinerary, cost_estimate=cost_estimate, status="planned")


class BookingAgent:
    """Booking agent confirms the plan with mock booking details."""

    def book(self, plan: TripPlan) -> TripPlan:
        """Attach booking reference and update plan status."""
        plan.booking_reference = "BOOK-TRIP-2026-001"
        plan.status = "booked"
        plan.itinerary.append("Booking: hotel, flight, and local transfer confirmed")
        return plan


class ReviewAgent:
    """Review agent evaluates whether the plan quality is acceptable."""

    def review(self, plan: TripPlan) -> TripPlan:
        """Assign review notes based on itinerary content."""
        if "flexible" in " ".join(plan.itinerary).lower():
            plan.review_notes = "Good plan: includes a flexible day and a balanced itinerary."
        else:
            plan.review_notes = "Please add more leisure options or transportation details."
        return plan

    def is_good(self, plan: TripPlan) -> bool:
        """Check whether the review notes mark the plan as good."""
        return "good plan" in (plan.review_notes or "").lower()


class HumanAgent:
    """Human-in-the-loop agent performs refinement after review or rejection."""

    def refine(self, plan: TripPlan, feedback: str = "Refine based on human review.") -> TripPlan:
        """Apply user feedback to the itinerary and update status."""
        plan.itinerary.append(f"Human feedback: {feedback}")
        plan.itinerary.append("Refinement: update itinerary to better fit human preferences")
        plan.status = "refining"
        return plan
