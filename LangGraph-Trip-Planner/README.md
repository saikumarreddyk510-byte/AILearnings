# LangGraph Multi-Agent Trip Planner

Ee project lo manam oka LangGraph-inspired multi-agent trip planner create chesam. Simple ga telugu + english mix style lo comments and architecture explain chesam.

## Project Structure

- `main.py` - root console entrypoint. Ikkada package CLI ni call chestam.
- `pyproject.toml` - Python package metadata, dependencies, optional dev deps.
- `requirements.txt` - runtime dependency list.
- `requirements-dev.txt` - development/test dependency list.
- `src/langgraph_trip_planner/` - actual package source code.
- `tests/` - unit tests.

## File Connections and Flow

This section spells out the end-to-end architecture and runtime flow.

### 1. Entrypoint

- `main.py` is the package entrypoint.
- It imports `main` from `langgraph_trip_planner.cli` and runs it.
- No business logic lives in `main.py`.

### 2. CLI and Request Creation

- `src/langgraph_trip_planner/cli.py` is the terminal interface.
- It prompts the user for:
  - origin city
  - destination city
  - travel dates
  - travel preferences
- It creates a `TripRequest` from `src/langgraph_trip_planner/models.py`.
- Then it calls `TripPlannerWorkflow.execute(request)`.

### 3. Workflow Orchestration

- `src/langgraph_trip_planner/workflow.py` defines `TripPlannerWorkflow`.
- `execute()` performs the core flow:
  1. `PlannerAgent.plan()` generates a base itinerary.
  2. `BookingAgent.book()` attaches booking details.
  3. `ReviewAgent.review()` evaluates quality and sets status.
  4. If the human did not accept the initial plan, `HumanAgent.refine()` reruns the workflow.
- The workflow also builds a `LangGraphModel` via `graph.py` to describe the logical nodes and edges.
- `MemoryStore` from `memory.py` logs each step as the workflow runs.

### 4. Agents and their responsibilities

- `src/langgraph_trip_planner/agents.py` contains:
  - `PlannerAgent`: create itinerary steps and high-level plan content.
  - `BookingAgent`: attach booking status and a simulated booking reference.
  - `ReviewAgent`: generate review notes and decide if human review is needed.
  - `HumanAgent`: convert user feedback into a refined plan.

### 5. Data Models

- `src/langgraph_trip_planner/models.py` defines:
  - `TripRequest`: user-provided travel details.
  - `TripPlan`: final plan content, cost estimate, booking reference, status, and notes.
- `TripPlan.summary()` returns the final plan text shown to the user.

### 6. Graph Model

- `src/langgraph_trip_planner/graph.py` defines `LangGraphModel`.
- It stores workflow nodes and edges, e.g.:
  - `planner` -> `booking`
  - `booking` -> `review`
  - `review` -> `human`
- `LangGraphModel.describe()` returns a text description of this graph.
- This is the project’s logical LangGraph-style representation.

### 7. Memory and Logging

- `src/langgraph_trip_planner/memory.py` defines `MemoryStore`.
- It logs each workflow stage with timestamps and notes.
- The CLI prints `workflow.memory.summary()` after the final plan.

## Architecture Summary

The runtime flow is:

`main.py` -> `cli.py` -> `TripPlannerWorkflow.execute()` ->
`PlannerAgent` -> `BookingAgent` -> `ReviewAgent` -> `HumanAgent`

With supporting models:

- `TripRequest` and `TripPlan` in `models.py`
- `LangGraphModel` in `graph.py`
- `MemoryStore` in `memory.py`

### Flow Diagram (text)

```
User input (cli.py)
      |
TripRequest created
      |
TripPlannerWorkflow.execute()
      |
PlannerAgent.plan()
      |
BookingAgent.book()
      |
ReviewAgent.review()
      |
HumanAgent.refine() [optional]
      |
Final TripPlan + MemoryStore summary
```

### Human feedback loop

- If the plan status is `pending_human_review`, CLI asks the user:
  - accept the plan
  - or provide improvement feedback
- If rejected, workflow reruns with `HumanAgent` refinement.
- This creates a human-in-the-loop review step in the runtime flow.

## Running Locally

1. Open terminal in `c:\learnAi\LangGraph-Trip-Planner`.
2. Create virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install runtime dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Run from terminal:
   ```powershell
   python main.py
   ```

## Testing

Run tests with:
```powershell
pytest
```

## Project Notes

- `main.py` only delegates to `cli.py`, so package logic stays inside `src/langgraph_trip_planner`.
- `workflow.py` owns business logic and human-in-the-loop refinement.
- `memory.py` keeps step-wise history so the plan can be audited.
- `graph.py` describes the logical LangGraph flow in code comments and runtime output.
