"""
CLI wrapper for the LangGraph Trip Planner.

This module handles terminal input, request creation, workflow execution,
user acceptance/refinement, and final output display.
"""

from .models import TripRequest
from .workflow import TripPlannerWorkflow


def prompt_input(prompt: str, default: str) -> str:
    """Prompt the user once and return the value or default."""
    value = input(prompt).strip()
    return value if value else default


def prompt_yes_no(prompt: str, default: bool = True) -> bool:
    """Prompt a yes/no question and return a boolean answer."""
    default_label = "yes" if default else "no"
    raw = input(f"{prompt} [{default_label}/{'no' if default else 'yes'}]: ").strip().lower()
    if raw == "":
        return default
    return raw in ("yes", "y")


def main() -> None:
    """Entry point for the CLI application.

    The CLI:
    - gathers travel input
    - constructs a TripRequest
    - runs the TripPlannerWorkflow
    - handles human review and refinement
    - prints final results and memory history
    """
    origin = prompt_input("Enter origin city: ", "New York")
    destination = prompt_input("Enter destination city: ", "Barcelona")
    dates = prompt_input("Enter travel dates (e.g. 2026-10-10 to 2026-10-17): ", "2026-10-10 to 2026-10-17")
    preferences = prompt_input("Enter travel preferences (e.g. culture, beach, relaxed pace): ", "culture, beach, relaxed pace")

    request = TripRequest(
        origin=origin,
        destination=destination,
        dates=dates,
        preferences=preferences,
    )

    workflow = TripPlannerWorkflow()
    print("\n--- Starting LangGraph Trip Planner ---")
    plan = workflow.execute(request)

    if plan.status == "pending_human_review":
        print("\nThe plan is ready for your review.")
        accepts = prompt_yes_no("Do you accept this trip plan?", default=False)
        if accepts:
            plan.status = "confirmed"
            workflow.memory.add("human", "User accepted the plan after review.")
        else:
            feedback = prompt_input("What should be improved? ", "Add more local experiences and flexible timing")
            workflow.memory.add("human", f"User feedback: {feedback}")
            plan = workflow.execute(request, user_accepts=False, user_feedback=feedback)

    print("\n=== Final Trip Plan ===")
    print(plan.summary())
    print("\n--- Workflow Memory Log ---")
    print(workflow.memory.summary())


if __name__ == "__main__":
    main()
