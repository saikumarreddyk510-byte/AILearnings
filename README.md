# AILearnings

> End-to-end AI engineering learning repo — Python fundamentals → ML → LangChain → RAG → Agents → Production apps.

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
