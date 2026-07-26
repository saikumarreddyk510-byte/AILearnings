# AI Career Coach using Traditional RAG

Idi oka end-to-end **Traditional RAG Application** — Resume and Job Description upload chesthe, AI career advice istundi.

---

## Architecture Diagram — Complete Flow

```
[User — Streamlit Browser UI]
        |
        v
[app.py — UI Entry Point]
   |
   |---> [file_utils.py]
   |       read_uploaded_file()
   |       - .txt  → decode UTF-8
   |       - .pdf  → PdfReader → extract pages
   |       - .docx → docx2txt.process()
   |       → returns plain text string
   |
   |---> [rag_engine.py — Stage 1: create_documents()]
   |       - Resume text → Document(metadata={doc_type: "resume"})
   |       - JD text     → Document(metadata={doc_type: "job_description"})
   |
   |---> [rag_engine.py — Stage 2: split_documents()]
   |       - RecursiveCharacterTextSplitter
   |       - chunk_size=800, chunk_overlap=150
   |       - Splits: "\n\n" → "\n" → "." → " " → ""
   |       → returns List[Document] (chunks)
   |
   |---> [rag_engine.py — Stage 3+4: build_vectorstore()]
   |       - get_embeddings() = HuggingFaceEmbeddings("all-MiniLM-L6-v2")
   |       - Each chunk → 384-dim vector
   |       - Chroma.from_documents() → store in ChromaDB
   |       - Saved to: career_coach_chroma_db/ (disk persist)
   |
   |---> [rag_engine.py — Stage 5: retrieve_context()]
   |       - vectorstore.as_retriever(k=6)
   |       - User query → embed → cosine similarity search
   |       → top-k relevant chunks returned
   |
   |---> [rag_engine.py — Stage 6: run_career_coach()]
           - get_llm() = ChatGroq(llama-3.1-8b-instant)
           - ChatPromptTemplate: {context} + {question}
           - Chain: prompt | llm | StrOutputParser()
           → Final career advice answer returned to UI
```

---

## File-by-File Connection

| File | Role | Calls |
|------|------|-------|
| `app.py` | Streamlit UI, user interaction | `file_utils.py`, `rag_engine.py` |
| `src/file_utils.py` | File reading (.txt/.pdf/.docx) | called by `app.py` |
| `src/rag_engine.py` | Complete RAG pipeline (6 stages) | called by `app.py` |
| `src/__init__.py` | Package init | - |
| `.env` | API keys (GROQ_API_KEY) | loaded by `rag_engine.py` |
| `career_coach_chroma_db/` | Persisted vector store | written/read by `rag_engine.py` |
| `data/` | Sample resume + JD files | used for testing |

---

## Detailed Stage Explanation (Telugu-English Mix)

### Stage 1 — Document Loading
- `file_utils.py` lo uploaded file ni plain text ga convert chestundi.
- Resume and JD text ni `create_documents()` lo LangChain `Document` objects ga wrap chestundi.
- Metadata lo `doc_type` store avutundi — "resume" or "job_description".

### Stage 2 — Chunking
- Peddha text ni `RecursiveCharacterTextSplitter` use chesi small chunks ga break chestundi.
- Munchuga `\n\n` (paragraphs) try chestundi, tarvata `\n`, `.`, ` ` order lo.
- `chunk_overlap=150` ante consecutive chunks lo 150 characters shared avutundi — context lost avvakapovadam ki.

### Stage 3 — Embeddings
- `HuggingFaceEmbeddings("all-MiniLM-L6-v2")` use chestundi — local ga run avutundi, API key avasaram ledu.
- Oka chunk → 384 numbers (vector) ga convert avutundi.
- Similar meaning unte vectors close ga untayi — idi similarity search ki base.

### Stage 4 — Vector Database (ChromaDB)
- Anni chunks vaati vectors toh patu ChromaDB lo store avutayi.
- `career_coach_chroma_db/` folder lo disk ki save avutundi — restart ayina data untundi.
- Pata data clear chesukoni fresh index create chestundi — data contamination avoid avutundi.

### Stage 5 — Context Retrieval
- User query ni embed chesi, stored vectors toh cosine similarity calculate chestundi.
- Top-k (k=6) most relevant chunks return avutayi.
- Ivi LLM ki context ga pass avutayi.

### Stage 6 — LLM Answer Generation
- Groq lo `llama-3.1-8b-instant` model use chestundi — fast and free.
- Prompt lo: retrieved context + user question.
- LangChain chain: `prompt | llm | StrOutputParser()` — clean answer return avutundi.
- 6 sections lo answer: Match Summary, Strengths, Gaps, Improvements, Projects, Interview Tips.

---

## Features

- Resume + JD upload cheyyadam (.txt, .pdf, .docx)
- RAG index build cheyyadam (chunking + embeddings + ChromaDB)
- Quick preset questions or custom question ask cheyyadam
- Complete career report generate cheyyadam
- Retrieved source chunks UI lo show avutayi — transparency ki

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

### 4. Add Groq API key
`.env` file create cheyyi:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Run app
```bash
streamlit run app.py
```

---

## Sample Files

`data/` folder lo sample resume and job description files unnai — testing ki use cheyyachu.

---

## Important Note

Best compatibility ki Python 3.10, 3.11, or 3.12 use cheyyandi.

---

## Deployment Guide — Complete Steps

### Architecture: Local to Streamlit Cloud

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT FLOW                            │
└─────────────────────────────────────────────────────────────────┘

LOCAL DEVELOPMENT:
  [Your Computer]
      ↓
  [Python venv]
  [requirements.txt installed]
  [.env with GROQ_API_KEY]
      ↓
  [streamlit run app.py]
  [Test at http://localhost:8501]
      ↓
  ✅ Works perfectly locally

GITHUB REPOSITORY:
  [Push to GitHub]
  [Main branch]
  [.env NOT committed (.gitignore protects)]
  [requirements.txt flexible versions]
      ↓
  ✅ Code safe, secrets protected

STREAMLIT CLOUD:
  [Connect GitHub repository]
  [Select app.py path]
  [Add secrets via UI]
      ↓
  [Streamlit Cloud reads .env alternative]
  [Uses environment variables for API keys]
      ↓
  ✅ App running at public URL
```

---

### Step 1: Local Development (Your Computer)

#### 1.1 Create virtual environment
```bash
python -m venv venv
```

#### 1.2 Activate environment
Windows PowerShell:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

#### 1.3 Install dependencies
```bash
pip install -r requirements.txt
```

**What happens here:**
- `requirements.txt` lo flexible versions specify chesi (`>=` use chesi), Streamlit Cloud lo compatibility issues avoid chestundi.
- All packages download and install avutayi — langchain, groq, chromadb, sentence-transformers, etc.

#### 1.4 Create `.env` file (lokalni testing ki)
```bash
# .env file create cheyyandi (Project-ai_career_coach_rag/ai_career_coach_rag/ lo)
GROQ_API_KEY=your_groq_api_key_here
```

Get API key from: https://console.groq.com/keys

#### 1.5 Test locally
```bash
streamlit run app.py
```

Browser lo http://localhost:8501 open avutundi.

**Test checklist:**
- ✅ Resume upload chey, file load avutey
- ✅ Job Description upload chey
- ✅ "Build Career Coach RAG Index" button click chey
- ✅ Questions ask chey
- ✅ Career advice answer return avutey

---

### Step 2: Prepare for GitHub (Code Commitment)

#### 2.1 Check `.gitignore` file
Verify that `.env` committed ye avvakapovadam ki:

```bash
# Check what files tracked avutunnayi
git status
```

**Expected output:** `.env` file undefined (ignored), regular files tracked

#### 2.2 View `.gitignore` contents
```
# Environment variables
.env
*.env
*.env.local

# ChromaDB vector store
career_coach_chroma_db/

# Python cache
__pycache__/
*.pyc
```

Idi ensure cheyyandi — `.env` ni commit cheyyakandi!

#### 2.3 Commit code
```bash
git add .
git commit -m "Career coach RAG app ready for deployment"
git push origin main
```

**At this point:**
- ✅ Code pushed to GitHub
- ✅ Secrets safe (`.env` not committed)
- ✅ `requirements.txt` flexible versions ga set

---

### Step 3: GitHub Setup (Connection)

#### 3.1 Ensure repository exists
- GitHub lo repository create cheyyandi (if not exists)
- Local code push cheyyandi (Step 2.3 lo)

#### 3.2 Get GitHub personal token (if needed)
- Settings → Developer settings → Personal access tokens
- "repo" scope select cheyyandi

---

### Step 4: Deploy to Streamlit Cloud

Streamlit Cloud ante oka free platform — oka URL pe app run avutundi worldwide users access cheyyakudadaru.

#### 4.1 Go to Streamlit Cloud
Visit: https://streamlit.io/cloud

#### 4.2 Sign in with GitHub
"Continue with GitHub" button click cheyyandi

#### 4.3 Deploy new app
1. Click **"New app"** button
2. **Repository:** Select your GitHub repo (AILearnings)
3. **Branch:** Select `main`
4. **File path:** `Project-ai_career_coach_rag/ai_career_coach_rag/app.py`
5. Click **"Deploy"**

**Deployment lo kalipi:** 
- Streamlit Cloud entire code download chestundi
- `requirements.txt` read chestundi
- Packages install avutayi (5-10 minutes untundi)
- App run avutundi

#### 4.4 Wait for deployment
Yellow "Building..." message, then green "Running" — app live avutundi!

---

### Step 5: Add Secrets (CRITICAL!)

**Important:** `.env` file cloud lo untundi anamata, Streamlit Cloud ki secrets management system untundi.

#### 5.1 Go to app settings
1. Deployed app lo top-right corner lo **"⋮"** (three dots) menu
2. Click **"Settings"**
3. Left sidebar lo **"Secrets"** section select cheyyandi

#### 5.2 Add GROQ_API_KEY
Text box lo copy-paste cheyyandi:
```toml
GROQ_API_KEY = "your_new_groq_api_key_here"
```

**Note:** Key quotes lo untey OK.

#### 5.3 Save
Click **"Save"** — Streamlit app automatic restart avutundi

**At this point:**
- ✅ App live at: `https://your-app-name.streamlit.app`
- ✅ API key secure (environment variable lo stored)
- ✅ Resume + JD upload chey, questions ask chey — worldwide users cheyyakudadaru

---

### Step 6: Use Deployed App

Public URL access cheyyandi:
```
https://your-app-name.streamlit.app
```

**Usage:**
1. Resume upload cheyyandi (.txt/.pdf/.docx)
2. Job Description upload cheyyandi
3. "Build Career Coach RAG Index" button click cheyyandi
4. Questions ask cheyyandi
5. Career advice answer return avutundi

---

### Troubleshooting

#### Issue 1: "ModuleNotFoundError" error Streamlit Cloud lo
**Solution:** `requirements.txt` lo package miss avadam ache
- Local lo test cheyyandi: `pip list | grep package_name`
- Missing package add cheyyandi `requirements.txt` lo
- Commit, push cheyyandi
- Streamlit Cloud lo app redeploy avutundi (automatic or manual)

#### Issue 2: "GROQ_API_KEY not found" error
**Solution:** Secrets add cheyyakunda mistake avadam ache
1. Go to app Settings → Secrets
2. Exact key lo add cheyyandi: `GROQ_API_KEY = "..."`
3. Save click cheyyandi
4. App refresh cheyyandi browser lo

#### Issue 3: App slow or "throttled" message
**Solution:** Streamlit Cloud free tier resource limits untayi
- App 12 days ga inactive unte sleep avtundi
- Again access chesthe wake-up avutundi (30 seconds wait)
- High usage untey paid plan (Streamlit Snowflake) consider cheyyandi

#### Issue 4: "Error installing requirements"
**Solution:** Version conflicts avadam ache
- `requirements.txt` lo flexible versions (`>=`) use cheyyandi
- Exact versions (`==`) avoid cheyyandi (unless critical)
- Sample:
  ```
  streamlit>=1.28
  langchain>=0.1
  chromadb>=0.3
  ```

---

### Important Security Notes

#### 🔴 NEVER do this:
- ❌ GROQ_API_KEY hardcode cheyyakandi code lo
- ❌ `.env` file commit cheyyakandi GitHub lo
- ❌ API key share cheyyakandi anyone toh
- ❌ Old API keys regenerate chesukuni delete cheyyakandi

#### ✅ DO this:
- ✅ `.env` add cheyyandi `.gitignore` lo
- ✅ API key regenerate cheyyandi Groq console lo (https://console.groq.com/keys)
- ✅ Streamlit Secrets use cheyyandi (not .env file)
- ✅ Different keys use cheyyandi local + cloud lo (if possible)

---

### Complete Deployment Checklist

- [ ] Local lo app test: `streamlit run app.py` works ✅
- [ ] `.env` file `.gitignore` lo add chey
- [ ] `requirements.txt` flexible versions lo update chey
- [ ] Code commit, push to GitHub cheyyandi
- [ ] Streamlit Cloud lo new app create cheyyandi
- [ ] `app.py` file path correct cheyyandi
- [ ] Secrets lo GROQ_API_KEY add cheyyandi
- [ ] Deployed URL lo test cheyyandi
- [ ] Resume upload, RAG index build, questions work cheyyandi

---

## It uses:

- LangChain
- Groq Chat model
- HuggingFace Embeddings
- ChromaDB Vector Database
- Streamlit UI
- Resume + Job Description analysis

## Features

- Upload Resume as `.txt`, `.pdf`, or `.docx`
- Upload Job Description as `.txt`, `.pdf`, or `.docx`
- Build a RAG index from both documents
- Retrieve relevant context from Resume and JD
- Generate:
  - Resume match summary
  - Skill gap analysis
  - Resume improvement suggestions
  - Project recommendations
  - Interview preparation questions

## RAG Stages Covered

1. Document Loading
2. Chunking
3. Embeddings
4. Vector Database Storage
5. Query Embedding
6. Context Retrieval
7. LLM Answer Generation

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
```

### 2. Activate environment

Windows PowerShell:

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

### 4. Add Groq API key

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Run app

```bash
streamlit run app.py
```

## Suggested Teaching Flow

1. Show the final app demo.
2. Explain Resume + JD as the knowledge base.
3. Explain document loading.
4. Explain chunking.
5. Explain embeddings.
6. Explain ChromaDB storage.
7. Explain query embedding and similarity search.
8. Explain LLM generation using retrieved context.
9. Show retrieved chunks in the UI.
10. Generate complete career report.

## Sample Files

Sample resume and job description are available in the `data/` folder.

## Important Note

For best compatibility with AI libraries, use Python 3.10, 3.11, or 3.12.
