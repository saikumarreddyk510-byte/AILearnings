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


It uses:

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
