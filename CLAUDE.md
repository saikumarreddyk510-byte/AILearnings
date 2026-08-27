# CLAUDE.md — AI Assistant Context for AILearnings

Read this file before writing, editing, or refactoring any code in this repo.

---

## What This Repo Is

A mono-repo of AI engineering learnings — from Python basics through LangChain, RAG, and production apps.
It is a **learning repository**, not a single application. Each folder is an independent module.

---

## Code Style Rules (Apply to ALL Python files)

### Comments
- Every single line must have a comment explaining what it does
- Comments written in **Telugu-English mix** (e.g., "Idi list ni sort chestundi — ascending order lo")
- Each file starts with an `# Architecture Diagram` block showing the data flow
- Each file has a `# Deep Architecture Notes` section explaining step-by-step

### Architecture block format (top of every file):
```python
# ---------------- Architecture Diagram ----------------
# [Input]
#    ↓
# [Step 1]
#    ↓
# [Output]
#
# ---------------- Deep Architecture Notes ----------------
# Step 1: ...
# Step 2: ...
```

### Variables & Imports
- `const`/`let` equivalent in Python: always use descriptive names
- Imports: one per line, with a comment explaining what it imports
- No wildcard imports (`from x import *`)

---

## Folder Purposes

| Folder | Purpose |
|---|---|
| `KrishAI/` | Python basics, Pydantic, fundamentals |
| `math/` | Linear algebra, math foundations |
| `ML/` | Machine learning — preprocessing, models |
| `LangChain/` | LangChain framework — all core concepts |
| `RAG/` | Retrieval-Augmented Generation — loaders, chunking |
| `CREWAI-PROJECT/` | CrewAI multi-agent notebooks |
| `LangGraph-Trip-Planner/` | LangGraph stateful agent project |
| `Project-ai_career_coach_rag/` | Production RAG app |
| `STARTUP-IDEA-VALIDATOR/` | Agent pipeline project |
| `jobpilot/` | Full-stack Next.js + AI production app |
| `docs/` | Roadmap, setup guides, learning notes |

---

## Environment Variables

All secrets in `.env` files — never hardcoded. Structure:

```ini
GROQ_API_KEY=...           # Groq cloud LLM
CLAUDE_API_KEY=...         # Anthropic Claude
LANGCHAIN_API_KEY=...      # LangSmith observability
LANGCHAIN_PROJECT=...      # LangSmith project name
```

`.env` files are gitignored. See any `.env.example` for structure.

---

## Never Do

- Hardcode API keys in source files
- Use `var` (Python equivalent: avoid re-binding with same name)
- Write code without Telugu-English comments
- Skip the Architecture Diagram block in new files
- Commit `venv/`, `__pycache__/`, `.env`

---

## How to Run

Each module is standalone. Run from its folder:

```bash
# RAG loaders
cd RAG/loaders
python pdfLoader.py

# LangChain examples
cd LangChain
python groq_langchain.py

# RAG chunking
cd RAG/chunking
python RecursiveCharacterTextSplitter.py
```
