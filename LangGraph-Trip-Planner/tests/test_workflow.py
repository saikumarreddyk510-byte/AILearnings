import pytest

from langgraph_trip_planner.agents import BookingAgent, PlannerAgent, ReviewAgent
from langgraph_trip_planner.models import TripRequest
from langgraph_trip_planner.workflow import TripPlannerWorkflow


def test_planner_agent_creates_itinerary():
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    plan = PlannerAgent().plan(request)

    assert plan.status == "planned"
    assert "Day 1" in plan.itinerary[0]
    assert plan.cost_estimate.startswith("Approx.")


def test_booking_agent_sets_booking_reference():
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    plan = PlannerAgent().plan(request)
    plan = BookingAgent().book(plan)

    assert plan.status == "booked"
    assert plan.booking_reference is not None
    assert any("Booking:" in item for item in plan.itinerary)


def test_review_agent_marks_good_plan():
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    plan = PlannerAgent().plan(request)
    plan = ReviewAgent().review(plan)

    assert "Good plan" in plan.review_notes


def test_workflow_confirms_plan_when_user_accepts(monkeypatch):
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    workflow = TripPlannerWorkflow()
    plan = workflow.execute(request, user_accepts=True)

    assert plan.status == "confirmed"


def test_workflow_refines_when_user_rejects(monkeypatch):
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    workflow = TripPlannerWorkflow()
    plan = workflow.execute(request, user_accepts=False, user_feedback="Add more local experiences.")

    assert plan.status == "confirmed"
    assert any("Refinement:" in step for step in plan.itinerary)
    assert any("Human feedback:" in step for step in plan.itinerary)


def test_workflow_pending_human_review():
    request = TripRequest("NYC", "Paris", "2026-10-10 to 2026-10-17", "culture")
    workflow = TripPlannerWorkflow()
    plan = workflow.execute(request)

    assert plan.status == "pending_human_review"
    assert workflow.memory.last().startswith("Plan awaits human approval")
