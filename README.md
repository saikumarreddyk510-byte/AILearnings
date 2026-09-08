# AILearnings

> End-to-end AI engineering learning repo — Python fundamentals → ML → LangChain → RAG → Agents → Production apps.

---

## Sequential Learning Plan (File by File)

Follow this exact order — each phase builds on concepts from the previous one: Python → math → classical ML → deep learning theory → serving models (Flask/Streamlit) → LLM orchestration (LangChain) → retrieval (RAG) → multi-agent systems (CrewAI) → stateful graphs (LangGraph) → three increasingly complex production apps.

**Phase 0 — Orientation**
1. `README.md` 2. `CLAUDE.md` 3. `docs/roadmap.md` 4. `docs/roadmap_flow.md`

**Phase 1 — Python Fundamentals** (`KrishAI/1-python Basics/`)
5. `basics.ipynb` 6. `functions.ipynb` 7. `exceptionhandiling.ipynb` 8. `fileOperations.ipynb` 9. `Modules&Packages.ipynb`

**Phase 2 — OOP, Tooling, Pydantic, Data Basics** (`KrishAI/`)
10. `oops.ipynb` (OOP + iterators/generators/closures/decorators) 11. `explainations.md` (Anaconda/VS Code/UV) 12. `pydantic.ipynb` 13. `explainations.md` (Pydantic half) 14. `DataAnalysisPython.md` 15. `SQL&SQLite.ipynb`

**Phase 3 — Math for AI** (`math/linearAlgebra/`)
16. `LinearAlgebra.md` 17. `Matrices.md` 18. `functions.md`

**Phase 4 — Feature Engineering & EDA** (`KrishAI/`)
19. `featureEngineering.ipynb` 20. `ExploratoryDataAnalysis&FeatureEngineering.ipynb`

**Phase 5 — Machine Learning** (`ML/`)
21. `explaination.md` 22. `dataPreprocessing/data_preprocessing_tools.ipynb` 23. `dataPreprocessing/Student_Placement_KNN.ipynb` 24. `Logitic_Regression_Practical.ipynb`

**Phase 6 — Deep Learning**
25. `DeepLearning/Explainations.md`

**Phase 7 — Web Frameworks (serving ML/AI)** (`KrishAI/`)
26. `flaskFramework.ipynb` 27. `app.py` 28. `streamlitWebFramework.ipynb`

**Phase 8 — LangChain** (`LangChain/`)
29. `.env.example` 30. `explainations.md` 31. `PromptTemplate.py` 32. `OutputParser.py` 33. `LECL.py` 34. `memory.py` 35. `groq_langchain.py` 36. `llama_langchain.py`

**Phase 9 — RAG** (`RAG/`)
37-41. `loaders/`: textLoader → pdfLoader → webLoader → helper → claude_helper
42-47. `chunking/`: characterTextSplitter → RecursiveCharacterTextSplitter → TokenTextSplitter → HTMLHeaderTextSplitter → RecursiveJsonSplitter → SemanticChunking

**Phase 10 — Multi-Agent (CrewAI)**
48-49. `CREWAI-PROJECT/`: README → `crewai_blog_project.ipynb`

**Phase 11 — Stateful Agents (LangGraph)**
50-53. `LangGraph-Trip-Planner/`: README → `src/` → `main.py` → `tests/`

**Phase 12 — Production RAG App**
54-56. `Project-ai_career_coach_rag/`: README → `src/` → `app.py`

**Phase 13 — Agent Pipeline Project**
57-58. `STARTUP-IDEA-VALIDATOR/`: README → `Code-Explain.ipynb`

**Phase 14 — Full-Stack Production App (jobpilot)**
59-64. `jobpilot/`: README → `ARCHITECTURE.md` → `flow-explained-telugu.md` → `src/` → `prisma/` → `tests/`

**Phase 15 — Optional Bonus**
65. `aacargo-clone/` (frontend clone practice, not core AI path)

---

## Repository Structure

```
AILearnings/
│
├── docs/                          # Learning roadmap & setup guides
│   ├── roadmap.md                 # Full AI engineer skill roadmap
│   ├── roadmap_flow.md            # Visual learning flow
│   └── ClaudeSetupAndLearn.md     # Claude Code setup guide
│
├── KrishAI/                       # Python & AI fundamentals
│   ├── 1-python Basics/           # Python notebooks (Jupyter)
│   ├── pydantic.ipynb             # Pydantic complete guide
│   └── explainations.md           # Concepts in Telugu-English
│
├── math/                          # Math for ML
│   └── linearAlgebra/             # Linear algebra notebooks
│
├── ML/                            # Machine learning
│   ├── dataPreprocessing/         # Data prep techniques
│   ├── src/                       # ML source code
│   └── explaination.md            # ML concepts explained
│
├── LangChain/                     # LangChain framework
│   ├── groq_langchain.py          # Groq + LangChain basic
│   ├── llama_langchain.py         # Local Llama with streaming
│   ├── PromptTemplate.py          # Dynamic prompts (4 levels)
│   ├── OutputParser.py            # StrOutputParser + JsonOutputParser
│   ├── LECL.py                    # Chains: simple, parallel, passthrough
│   ├── memory.py                  # Conversation memory (3 approaches)
│   └── explainations.md           # Full LangChain guide (Telugu-English)
│
├── RAG/                           # Retrieval-Augmented Generation
│   ├── loaders/                   # Document loaders
│   │   ├── helper.py              # RAG helper — Groq LLM
│   │   ├── claude_helper.py       # RAG helper — Anthropic Claude
│   │   ├── pdfLoader.py           # PDF → RAG
│   │   ├── webLoader.py           # Web URL → RAG (+ SoupStrainer)
│   │   └── textLoader.py          # Text file → RAG
│   └── chunking/                  # Text splitting strategies
│       ├── RecursiveCharacterTextSplitter.py
│       ├── characterTextSplitter.py
│       ├── TokenTextSplitter.py
│       ├── SemanticChunking.py
│       └── speech.txt             # Sample file for chunking demo
│
├── CREWAI-PROJECT/                # CrewAI multi-agent system
│   └── crewai_blog_project.ipynb
│
├── LangGraph-Trip-Planner/        # LangGraph stateful agent
│   ├── src/                       # Trip planner source
│   ├── tests/                     # Unit tests
│   └── main.py                    # Entry point
│
├── Project-ai_career_coach_rag/   # Production RAG app — AI career coach
│
├── STARTUP-IDEA-VALIDATOR/        # Agent pipeline — startup idea validator
│
├── jobpilot/                      # Full-stack Next.js + AI app
│   ├── src/                       # Next.js app source
│   ├── prisma/                    # Database schema & migrations
│   └── tests/                     # E2E + unit tests
│
├── aacargo-clone/                 # Frontend clone project
│
├── requirements.txt               # Shared Python dependencies
├── .gitignore
└── CLAUDE.md                      # AI assistant context for this repo
```

---

## Learning Path

```
1. Python Basics      →  KrishAI/
2. Math for ML        →  math/
3. Machine Learning   →  ML/
4. LangChain          →  LangChain/
5. RAG Systems        →  RAG/
6. Multi-Agent (CrewAI) →  CREWAI-PROJECT/
7. Stateful Agents (LangGraph) →  LangGraph-Trip-Planner/
8. Production Apps    →  jobpilot/, Project-ai_career_coach_rag/
```

---

## Setup

```bash
# 1. Clone
git clone https://github.com/saikumarreddyk510-byte/AILearnings.git
cd AILearnings

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy .env.example to .env in the relevant project folder and fill in keys:
# GROQ_API_KEY, CLAUDE_API_KEY, LANGCHAIN_API_KEY, LANGCHAIN_PROJECT
```

---

## Key Conventions

| Convention | Rule |
|---|---|
| Every `.py` file | Line-by-line comments in Telugu-English mix |
| Architecture | Each file has `# Architecture Diagram` at top |
| Secrets | Always in `.env` — never hardcoded |
| Explanations | `explainations.md` in each module folder |
| Notebooks | `.ipynb` for interactive learning, `.py` for runnable scripts |
