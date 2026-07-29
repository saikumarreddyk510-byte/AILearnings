"""
TripPlannerWorkflow orchestrates the LangGraph multi-agent flow.

This module glues the planning, booking, review, and human approval stages.
It also builds a simple graph model and logs workflow memory.
"""

from typing import Optional

from .agents import BookingAgent, HumanAgent, PlannerAgent, ReviewAgent
from .graph import LangGraphModel
from .memory import MemoryStore
from .models import TripPlan, TripRequest


class TripPlannerWorkflow:
    """Workflow manager for TripRequest -> TripPlan conversion."""

    def __init__(self) -> None:
        self.graph = LangGraphModel()
        self.planner = PlannerAgent()
        self.booker = BookingAgent()
        self.reviewer = ReviewAgent()
        self.human = HumanAgent()
        self.memory = MemoryStore()
        self._build_graph()

    def _build_graph(self) -> None:
        """Build the logical LangGraph node/edge model for the workflow."""
        self.graph.add_node("planner", "PlannerAgent builds candidate itinerary")
        self.graph.add_node("booking", "BookingAgent confirms bookings")
        self.graph.add_node("review", "ReviewAgent validates the final plan")
        self.graph.add_node("human", "Human-in-the-loop approval and feedback")
        self.graph.add_edge("planner", "booking")
        self.graph.add_edge("booking", "review")
        self.graph.add_edge("review", "human")

    def execute(
        self,
        request: TripRequest,
        user_accepts: Optional[bool] = None,
        user_feedback: Optional[str] = None,
    ) -> TripPlan:
        """Run the trip planning workflow.

        The flow is:
        - plan with PlannerAgent
        - book with BookingAgent
        - review with ReviewAgent
        - optionally refine with HumanAgent
        """
        print(self.graph.describe())

        plan = self.planner.plan(request)
        self.memory.add("planner", f"Initial plan for {request.destination} created.")
        attempt = 1

        while True:
            print(f"\n--- Workflow pass #{attempt} ---")
            plan = self.booker.book(plan)
            self.memory.add("booking", f"Booked trip with reference {plan.booking_reference}.")

            plan = self.reviewer.review(plan)
            self.memory.add("review", f"Review note: {plan.review_notes}")
            print(f"Review notes: {plan.review_notes}")

            print("\nMemory summary:")
            print(self.memory.summary())

            if user_accepts is True:
                plan.status = "confirmed"
                self.memory.add("human", "User accepted the plan.")
                break

            if user_accepts is False:
                print("User rejected the plan. Human feedback loop triggered...")
                self.memory.add("human", "User rejected the plan and asked for refinement.")
                plan = self.human.refine(plan, user_feedback or "User requested adjustments.")
                attempt += 1
                if attempt > 5:
                    print("Reached maximum refinement attempts. Finalizing current plan.")
                    plan.status = "confirmed"
                    break
                continue

            if self.reviewer.is_good(plan):
                print("Review is positive, but human approval is still required.")
                plan.status = "pending_human_review"
                self.memory.add("human", "Plan awaits human approval after review.")
                break

            print("Plan is not good enough yet. Human review required before final decision.")
            plan = self.human.refine(plan, "Review feedback triggered refinement.")
            self.memory.add("human", "Human refinement applied based on review feedback.")
            attempt += 1
            if attempt > 5:
                print("Reached maximum refinement attempts. Finalizing current plan.")
                plan.status = "confirmed"
                break

        return plan
