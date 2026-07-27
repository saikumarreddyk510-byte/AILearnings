# Startup Idea Validator

Idi oka **AI-powered startup idea validation tool** — CrewAI agents toh Groq LLM use chesi, startup ideas ni comprehensive analysis chestundi.

---

## Architecture

```
[User Input: Startup Idea]
        ↓
[Groq LLM: llama-3.1-8b-instant]
        ↓
[CrewAI Multi-Agent System]
  ├── Research Agent
  │   └── DuckDuckGo search, Wikipedia lookup
  ├── Analysis Agent
  │   └── Market viability, competition, revenue potential
  └── Report Agent
      └── Final recommendations & implementation roadmap
        ↓
[Comprehensive Validation Report]
  - Market analysis
  - Competition landscape
  - Revenue potential
  - Risk assessment
  - Implementation steps
```

---

## Features

- **AI-Powered Analysis** - Groq LLM (free, no rate limits)
- **Multi-Agent Workflow** - CrewAI for coordinated analysis
- **Web Research** - DuckDuckGo + Wikipedia integration
- **Streamlit UI** - User-friendly interface
- **Comprehensive Reports** - Market viability, competition, roadmap

---

## Setup

### 1. Create virtual environment
```bash
python -m venv venv
```

### 2. Activate environment
Windows:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

### 3. Install requirements
```bash
pip install -r requirements.txt
```

### 4. Add API key
Create `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get free API key from: https://console.groq.com/keys

### 5. Run notebook (testing)
```bash
jupyter notebook Code-Explain.ipynb
```

### 6. Run Streamlit app (once built)
```bash
streamlit run app.py
```

---

## File Structure

```
STARTUP-IDEA-VALIDATOR/
├── Code-Explain.ipynb      # Notebook with setup & examples
├── requirements.txt        # Python dependencies
├── .env                    # API keys (not committed)
├── .gitignore             # Git ignore file
├── README.md              # This file
└── app.py                 # Streamlit app (to be built)
```

---

## Usage

1. Run notebook to test Groq client connection
2. Modify CrewAI agents for your use case
3. Build Streamlit UI for user interaction
4. Deploy to Streamlit Cloud or your server

---

## Important Notes

- **Security:** .env file contains API key — never commit to GitHub
- **Rate Limits:** Groq free tier has generous limits
- **Agent Configuration:** Customize agents in Code-Explain.ipynb
- **Web Search:** CrewAI tools require internet connection

---

**Created:** 2026-07-26
**Status:** In Development 🚀
