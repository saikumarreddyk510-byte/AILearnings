# CrewAI Blog Project

This project creates a small CrewAI workflow for writing and editing a blog post.

## 1) Create and activate a virtual environment (recommended)

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Configure environment variables

1. Copy `.env.example` to `.env`
2. Set your actual keys:
   - `GROQ_API_KEY`
   - `SERPER_API_KEY`

## 4) Run the project

```powershell
python blog_crew.py
```

## Notes

- The script uses `groq/llama3-8b-8192` through CrewAI/LiteLLM.
- `SerperDevTool` enables research via web search for the writer agent.
