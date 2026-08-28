# =============================================================================
# END-TO-END RAG ARCHITECTURE — helper.py
# =============================================================================
#
#  DOCUMENT LOADERS (caller files)
#  ┌─────────────────────────────────────────────────────────────────────┐
#  │  pdfLoader.py          webLoader.py          textLoader.py          │
#  │  PyPDFLoader()         WebBaseLoader()        TextLoader()           │
#  │  "resume.pdf"          "https://url"          "speech.txt"           │
#  │       │                     │                      │                  │
#  │       └─────────────────────┴──────────────────────┘                 │
#  │                             │                                         │
#  │                      docs = loader.load()                             │
#  │                             │                                         │
#  │            List[Document]   │   Each Document has:                   │
#  │            ┌────────────────┴──────────────────────┐                 │
#  │            │  page_content: "actual text content"   │                 │
#  │            │  metadata:     {source, page, url...}  │                 │
#  │            └───────────────────────────────────────┘                 │
#  └─────────────────────────────────────────────────────────────────────┘
#                             │
#                             ▼
#  ┌─────────────────────────────────────────────────────────────────────┐
#  │              ask_from_docs(docs, question)   ← this file            │
#  │                                                                      │
#  │  STEP 1 — SPLIT                                                      │
#  │  RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)  │
#  │                                                                      │
#  │  [Doc1: page1 text (5000 chars)]  →  [chunk1][chunk2][chunk3][...]  │
#  │  [Doc2: page2 text (4800 chars)]  →  [chunk4][chunk5][chunk6][...]  │
#  │  [Doc3: page3 text (3200 chars)]  →  [chunk7][chunk8][...]          │
#  │                                                                      │
#  │  Split strategy: \n\n → \n → " " → "" (recursive fallback)         │
#  │  chunk_overlap=200 → consecutive chunks share 200 chars             │
#  │                             │                                        │
#  │                             ▼                                        │
#  │  STEP 2 — EMBED                                                      │
#  │  HuggingFaceEmbeddings("sentence-transformers/all-MiniLM-L6-v2")    │
#  │                                                                      │
#  │  "Chains connect LangChain components" → [0.12, -0.45, 0.87, ...]  │
#  │  "Agents use LLMs to pick tools"       → [0.34, -0.21, 0.65, ...]  │
#  │  Each chunk text → 384-dimensional float vector                     │
#  │                             │                                        │
#  │                             ▼                                        │
#  │  STEP 3 — STORE                                                      │
#  │  Chroma.from_documents(chunks, embeddings)                           │
#  │                                                                      │
#  │  ┌─────────────────────────────────────┐                            │
#  │  │  Chroma Vector Store (in-memory)    │                            │
#  │  │  ┌──────────────────────────────┐  │                            │
#  │  │  │ chunk1 → [0.12, -0.45, ...]  │  │                            │
#  │  │  │ chunk2 → [0.34, -0.21, ...]  │  │                            │
#  │  │  │ chunk3 → [0.87,  0.11, ...]  │  │                            │
#  │  │  │ ...    → [...]               │  │                            │
#  │  │  └──────────────────────────────┘  │                            │
#  │  └─────────────────────────────────────┘                            │
#  │                             │                                        │
#  │                             ▼                                        │
#  │  STEP 4 — RETRIEVE                                                   │
#  │  retriever = vectorstore.as_retriever(k=3)                           │
#  │                                                                      │
#  │  question: "What is the current company?"                            │
#  │       │                                                              │
#  │       ▼  embed question → question_vector                            │
#  │  [0.45, -0.12, 0.78, ...]   ← question vector                      │
#  │       │                                                              │
#  │       ▼  cosine similarity with all stored chunk vectors             │
#  │  chunk7 → similarity: 0.92  ← most relevant ✅                      │
#  │  chunk3 → similarity: 0.87  ← 2nd relevant ✅                       │
#  │  chunk1 → similarity: 0.81  ← 3rd relevant ✅                       │
#  │  chunk2 → similarity: 0.43  ← not relevant                          │
#  │       │                                                              │
#  │       ▼  top k=3 chunks return                                       │
#  │  relevant_docs = [chunk7, chunk3, chunk1]                            │
#  │                             │                                        │
#  │                             ▼                                        │
#  │  STEP 5 — BUILD CONTEXT                                              │
#  │  context = "\n\n".join(doc.page_content for doc in relevant_docs)   │
#  │                                                                      │
#  │  "April 2024 - Present\nTest Automation Engineer | HeartCentrix..."  │
#  │  + "\n\n"                                                            │
#  │  "Responsibilities: Developed and maintained automated test..."      │
#  │  + "\n\n"                                                            │
#  │  "Skills: Java, Python, Selenium, Cucumber..."                       │
#  │                             │                                        │
#  │                             ▼                                        │
#  │  STEP 6 — PROMPT + LLM + PARSE                                       │
#  │                                                                      │
#  │  ChatPromptTemplate.from_template(...)                               │
#  │  ┌─────────────────────────────────────────────────────────┐        │
#  │  │ "Answer using ONLY the given context.                   │        │
#  │  │  Context: {context}   ← 3 retrieved chunks fill here   │        │
#  │  │  Question: {question} ← user question fill here        │        │
#  │  │  If not in context → say 'I don't know...'"            │        │
#  │  └─────────────────────────────────────────────────────────┘        │
#  │       │                                                              │
#  │       ▼  LCEL chain: prompt | llm | StrOutputParser()               │
#  │                                                                      │
#  │  ChatGroq(model="qwen/qwen3.6-27b", temperature=0.3)                │
#  │  → reads context + question                                          │
#  │  → generates grounded answer (no hallucination)                     │
#  │       │                                                              │
#  │       ▼  StrOutputParser()                                           │
#  │  "The current working company is HeartCentrix Solutions,            │
#  │   and the role is Test Automation Engineer."                         │
#  │                             │                                        │
#  └─────────────────────────────┼────────────────────────────────────── ┘
#                                ▼
#                    return answer  →  caller file prints it
#
# =============================================================================
# FULL END-TO-END SUMMARY
# =============================================================================
#
#  pdfLoader.py / webLoader.py / textLoader.py
#       │  loader.load()
#       ▼
#  List[Document] (raw pages/web content)
#       │  RecursiveCharacterTextSplitter (1000 chars, 200 overlap)
#       ▼
#  List[Document] (small chunks, ~50-100 per document)
#       │  HuggingFaceEmbeddings → 384-dim vectors per chunk
#       ▼
#  Chroma vectorstore (in-memory, all chunk vectors stored)
#       │  retriever.invoke(question) → cosine similarity → top 3 chunks
#       ▼
#  relevant_docs (List[Document], 3 most relevant chunks)
#       │  "\n\n".join(page_content) → single context string
#       ▼
#  context string (~3000 chars of relevant content)
#       │  ChatPromptTemplate → fills {context} + {question}
#       ▼
#  formatted prompt → ChatGroq (qwen3.6-27b, temperature=0.3)
#       │  StrOutputParser → plain text
#       ▼
#  answer string → returned to caller → print()
#
# =============================================================================
# FILE CONNECTIONS
# =============================================================================
#
#  pdfLoader.py   ──► from helper import ask_from_docs
#  webLoader.py   ──► from helper import ask_from_docs
#  textLoader.py  ──► from helper import ask_from_docs
#
#  claude_helper.py ← same pipeline, ChatAnthropic instead of ChatGroq
#
# =============================================================================
# HOW HuggingFace + ChatGroq WORK HAND IN HAND — Combined Architecture
# =============================================================================
#
# Simple answer: They do TWO completely different jobs in the same pipeline.
#
#   HuggingFace Embeddings → FINDING job   (which chunks are relevant?)
#   ChatGroq               → ANSWERING job (what is the answer from those chunks?)
#
# They never talk to each other directly.
# One runs first, other runs second. Together they make RAG work.
#
# ─────────────────────────────────────────────────────────────────────────────
#
#  WHERE EACH COMPONENT RUNS:
#
#   ┌─────────────────────────────────────────────────────────────────────┐
#   │  YOUR MACHINE (local)              │  GROQ CLOUD (internet)         │
#   │                                    │                                 │
#   │  HuggingFace sentence-transformers │  api.groq.com                   │
#   │  (Python process, no server)       │  (LPU hardware)                 │
#   │                                    │                                 │
#   │  all-MiniLM-L6-v2 model           │  qwen/qwen3.6-27b model         │
#   │  22MB, cached locally              │  27 billion parameters          │
#   │                                    │                                 │
#   │  Job: text → 384-dim vector        │  Job: context+question → answer │
#   │  No internet needed (after setup)  │  Internet required              │
#   │  No API key                        │  Needs GROQ_API_KEY             │
#   └────────────────────────────────────┴─────────────────────────────────┘
#
# ─────────────────────────────────────────────────────────────────────────────
#
#  COMPLETE FLOW — Who does what, when:
#
#  USER calls: ask_from_docs(docs, "What is the current company?")
#       │
#       ▼
#  ══ PHASE 1: INDEXING (HuggingFace does all the work here) ══════════════
#       │
#       ├─ RecursiveCharacterTextSplitter splits docs → 50-80 chunks
#       │
#       ├─ HuggingFaceEmbeddings.embed_documents(chunks)
#       │       │
#       │       │  LOCAL — Python process, no internet, no API key
#       │       │
#       │       ├─ chunk1 text → all-MiniLM-L6-v2 model → [0.12,-0.45,...] 384 nums
#       │       ├─ chunk2 text → all-MiniLM-L6-v2 model → [0.34,-0.21,...] 384 nums
#       │       ├─ chunk3 text → all-MiniLM-L6-v2 model → [0.87, 0.11,...] 384 nums
#       │       └─ ... (all chunks embedded)
#       │
#       └─ Chroma.from_documents() — all vectors stored in-memory
#
#  ══ PHASE 2: RETRIEVAL (HuggingFace again) ══════════════════════════════
#       │
#       ├─ retriever.invoke("What is the current company?")
#       │
#       ├─ HuggingFaceEmbeddings.embed_query(question)
#       │       │
#       │       │  LOCAL — same model, same process
#       │       │
#       │       └─ "What is current company?" → [0.45,-0.12,...] 384 nums
#       │
#       ├─ Chroma cosine similarity:
#       │       chunk7 score: 0.92  ✅ top 1
#       │       chunk3 score: 0.87  ✅ top 2
#       │       chunk1 score: 0.81  ✅ top 3
#       │       chunk2 score: 0.43  ✗ skip
#       │
#       └─ relevant_docs = [chunk7, chunk3, chunk1]
#
#  ══ PHASE 3: GENERATION (ChatGroq does all the work here) ════════════════
#       │
#       ├─ context = join(chunk7 + chunk3 + chunk1 text)
#       │
#       ├─ prompt filled: "Answer only from context.\nContext: ...\nQuestion: ..."
#       │
#       ├─ ChatGroq.invoke(prompt)
#       │       │
#       │       │  INTERNET CALL — HTTP POST → api.groq.com
#       │       │
#       │       │  Groq LPU server receives prompt
#       │       │  qwen3.6-27b model reads context + question
#       │       │  Generates answer token by token (~300-500 tokens/sec)
#       │       │
#       │       └─ "The current working company is HeartCentrix Solutions,
#       │             and the role is Test Automation Engineer."
#       │
#       └─ StrOutputParser extracts plain text → return answer
#
# ─────────────────────────────────────────────────────────────────────────────
#
#  WHY NOT USE ChatGroq FOR EMBEDDINGS TOO?
#
#  ChatGroq (Groq) = LLM — text generation, question answering
#  Groq does NOT provide an embedding API
#  Embedding ki different specialized model needed → HuggingFace fills that gap
#
#  WHY NOT USE HuggingFace FOR ANSWERING TOO?
#
#  all-MiniLM-L6-v2 = embedding model only
#  It converts text → vector (384 numbers)
#  It cannot generate answers, explain concepts, or reason
#  For generation → ChatGroq (or ChatOpenAI, ChatAnthropic) needed
#
# ─────────────────────────────────────────────────────────────────────────────
#
#  OLLAMA ALTERNATIVE — if you want everything local:
#
#  Currently (this file):
#    Embeddings: HuggingFace (local, free) ✅
#    LLM:        ChatGroq    (cloud, needs internet + API key) ⚠️
#
#  Full local with Ollama:
#    Embeddings: OllamaEmbeddings(model="nomic-embed-text") → local
#    LLM:        ChatOllama(model="llama3")                 → local
#    Both local → works offline, no API key, total privacy ✅
#
#  Code change needed (only 2 lines):
#    from langchain_ollama import ChatOllama, OllamaEmbeddings
#    llm        = ChatOllama(model="llama3")
#    embeddings = OllamaEmbeddings(model="nomic-embed-text")
#    ask_from_docs() unchanged ✅ — same pipeline, different providers
#
# =============================================================================
# SWITCHING TO OLLAMA — Complete Step-by-Step Setup Process
# =============================================================================
#
#  You have HuggingFace already. Ollama ki switch cheyyadam ante:
#  3 things download/install cheyyali → 2 lines code change → done.
#
# ─────────────────────────────────────────────────────────────────────────────
#  STEP 1 — Download & Install Ollama App
# ─────────────────────────────────────────────────────────────────────────────
#
#  1a. Go to: https://ollama.com/download
#      → Windows installer download cheyyi (.exe file)
#      → Install cheyyi (like any app — Next → Next → Finish)
#
#  1b. After install, Ollama background lo run avutundi automatically
#      → System tray lo Ollama icon kanipistundi (bottom-right taskbar)
#      → Or terminal lo check: ollama --version
#
#  1c. Verify running:
#      → Open browser → http://localhost:11434
#      → "Ollama is running" text kanipiste — success ✅
#
# ─────────────────────────────────────────────────────────────────────────────
#  STEP 2 — Pull LLM Model (for answering questions)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Terminal lo run cheyyi:
#
#  Option A — Llama 3.2 (3B, small, fast, good quality)
#    ollama pull llama3.2
#    Size: ~2GB
#
#  Option B — Llama 3.1 (8B, medium, better quality)
#    ollama pull llama3.1
#    Size: ~4.7GB
#
#  Option C — Mistral (7B, fast + good)
#    ollama pull mistral
#    Size: ~4.1GB
#
#  Recommended for RAG (balance of speed + quality):
#    ollama pull llama3.2   ← start here if unsure
#
#  Check what's downloaded:
#    ollama list            ← shows all pulled models
#
#  Remove a model:
#    ollama rm llama3.2     ← frees disk space
#
# ─────────────────────────────────────────────────────────────────────────────
#  STEP 3 — Pull Embedding Model (for finding relevant chunks)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Embeddings ki LLM different — small specialized model use cheyyali:
#
#  Recommended:
#    ollama pull nomic-embed-text
#    Size: ~274MB  (very small!)
#    Dims: 768
#
#  Alternative:
#    ollama pull mxbai-embed-large
#    Size: ~669MB
#    Dims: 1024 (higher quality)
#
#  Verify:
#    ollama list   ← should show both llama3.2 and nomic-embed-text
#
# ─────────────────────────────────────────────────────────────────────────────
#  STEP 4 — Install Python Package
# ─────────────────────────────────────────────────────────────────────────────
#
#  Terminal lo (in learnAi folder):
#    pip install langchain-ollama
#
#  (langchain-groq and langchain-huggingface already installed unnay —
#   those still work, we're just adding Ollama as another option)
#
# ─────────────────────────────────────────────────────────────────────────────
#  STEP 5 — Code Change (only 2 lines in this file)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Current code (this file, lines ~230 and ~250):
#    from langchain_groq import ChatGroq
#    from langchain_huggingface import HuggingFaceEmbeddings
#    ...
#    llm = ChatGroq(model="qwen/qwen3.6-27b", temperature=0.3)
#    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#
#  Change to Ollama (replace those 2 lines):
#    from langchain_ollama import ChatOllama, OllamaEmbeddings
#    ...
#    llm        = ChatOllama(model="llama3.2", temperature=0.3)
#    embeddings = OllamaEmbeddings(model="nomic-embed-text")
#
#  Everything else (ask_from_docs function) stays exactly the same ✅
#  No API key needed, no .env change, works offline
#
# ─────────────────────────────────────────────────────────────────────────────
#  VERIFICATION — Test Ollama works
# ─────────────────────────────────────────────────────────────────────────────
#
#  Quick test in terminal:
#    ollama run llama3.2
#    >>> Hello, what is RAG?
#    [answer appears] → model working ✅
#    >>> /bye           → exit chat
#
#  Or Python test:
#    from langchain_ollama import ChatOllama
#    llm = ChatOllama(model="llama3.2")
#    print(llm.invoke("What is LangChain?").content)
#
# ─────────────────────────────────────────────────────────────────────────────
#  FULL COMPARISON AFTER SWITCH
# ─────────────────────────────────────────────────────────────────────────────
#
#  Feature            │ Current (HuggingFace+Groq)  │ After Switch (Ollama)
#  ───────────────────┼─────────────────────────────┼─────────────────────────
#  Embeddings         │ HuggingFace (local, 22MB)   │ Ollama (local, 274MB)
#  LLM                │ ChatGroq (cloud, fast)      │ ChatOllama (local)
#  Internet needed    │ Yes (for LLM)               │ No (fully offline) ✅
#  API key            │ GROQ_API_KEY needed         │ None needed ✅
#  Privacy            │ Partial (LLM sees data)     │ Full (nothing leaves PC) ✅
#  Speed              │ LLM: 300-500 tok/s (Groq)  │ Depends on your machine
#  Quality            │ qwen3.6-27b: very good      │ llama3.2: good
#  Setup effort       │ Already done                │ 3 downloads + 1 pip
#  ───────────────────┴─────────────────────────────┴─────────────────────────
#
# ─────────────────────────────────────────────────────────────────────────────
#
#  ONE LINE SUMMARY:
#
#  HuggingFace = finds the right pages (local, free, no internet)
#  ChatGroq    = reads those pages and writes the answer (cloud, fast)
#  Together    = RAG: smart search + smart answer = grounded AI responses
#
# =============================================================================

from pathlib import Path
# Path — Python built-in class for working with file system paths
# Cross-platform ga paths handle chestundi — Windows \ and Linux / both work
# __file__ — current file (helper.py) ki absolute path
# Idi use case: .env file same folder lo undo ani check cheyyadam

# `.env` file nundi secret keys load cheyyadaniki.
from dotenv import load_dotenv
# load_dotenv() — .env file lo unna KEY=VALUE pairs ni os.environ lo load chestundi
# After this: os.getenv("GROQ_API_KEY") tho key access cheyyachu anywhere

# Groq LLM ni call cheyyadaniki class.
from langchain_groq import ChatGroq
# ChatGroq — LangChain's Groq integration
# Groq = cloud platform that runs LLMs fast using custom LPU hardware
# This class mana question ni Groq ki pampi, answer teesukuntundi

# Long docs ni chunks ga split cheyyadaniki.
from langchain_text_splitters import RecursiveCharacterTextSplitter
# RecursiveCharacterTextSplitter — text ni chinna pieces (chunks) ga split chestundi
# "Recursive" → separators try chese order: \n\n → \n → " " → ""
# Why split? LLM ki oka sarige 100 pages pass cheyyatam expensive + ineffective
# Only relevant 3-5 chunks pass cheste — cheaper + accurate

# Text ni embedding vectors ga convert cheyyadaniki.
from langchain_huggingface import HuggingFaceEmbeddings
# HuggingFaceEmbeddings — text ni numbers (vectors) ga convert cheyyadaniki
# "all-MiniLM-L6-v2" model — text meaning ni 384-dimensional vector ga represent chestundi
# Similar meaning unna texts → similar vectors → similarity search possible avutundi

# Vector database (store + retrieve similar chunks).
from langchain_chroma import Chroma
# =============================================================================
# WHAT IS CHROMA DB? — Working Principle, Storage, Architecture
# =============================================================================
#
# Chroma = open-source vector database purpose-built for AI applications.
# Idi chunk vectors store chestundi + question vector tho similarity search chestundi.
#
# ─────────────────────────────────────────────────────────────────────────────
# WHAT IS A VECTOR DATABASE?
# ─────────────────────────────────────────────────────────────────────────────
#
#  Normal database (SQL):           Vector database (Chroma):
#  ┌────────────────────────┐       ┌────────────────────────────────────┐
#  │ id │ name  │ age       │       │ id │ text        │ vector           │
#  ├────┼───────┼───────────┤       ├────┼─────────────┼──────────────────┤
#  │ 1  │ Alice │ 25        │       │ 1  │ "cat sat.." │ [0.12,-0.45,...] │
#  │ 2  │ Bob   │ 30        │       │ 2  │ "dog ran.." │ [0.13,-0.44,...] │
#  └────────────────────────┘       └────────────────────────────────────┘
#  Query: WHERE age = 25            Query: SIMILAR TO [0.45,-0.12,...] LIMIT 3
#  (exact match)                    (similarity match — finds meaning-close chunks)
#
# ─────────────────────────────────────────────────────────────────────────────
# CHROMA ARCHITECTURE — Two Modes
# ─────────────────────────────────────────────────────────────────────────────
#
#  MODE 1 — In-Memory (we use this) ← default in this file
#  ┌──────────────────────────────────────────────┐
#  │  Python Process Memory (RAM)                 │
#  │                                              │
#  │  ┌──────────────────────────────────────┐   │
#  │  │  Chroma Collection                   │   │
#  │  │  ┌────────────────────────────────┐  │   │
#  │  │  │ chunk_id │ text  │ vector      │  │   │
#  │  │  │ chunk_1  │ "..." │ [0.12,...]  │  │   │
#  │  │  │ chunk_2  │ "..." │ [0.34,...]  │  │   │
#  │  │  │ chunk_3  │ "..." │ [0.87,...]  │  │   │
#  │  │  └────────────────────────────────┘  │   │
#  │  └──────────────────────────────────────┘   │
#  └──────────────────────────────────────────────┘
#  → Program close aithe data gone (no persistence)
#  → Fast, no setup, perfect for RAG pipeline per-run
#  → Code: Chroma.from_documents(chunks, embeddings)  ← no persist_directory
#
#  MODE 2 — Persistent (disk storage, survives restart)
#  ┌──────────────────────────────────────────────┐
#  │  Disk: ./chroma_db/ folder                   │
#  │  ┌──────────────────────────────────────┐    │
#  │  │  chroma.sqlite3                      │    │
#  │  │  (metadata, ids, text stored here)   │    │
#  │  │                                      │    │
#  │  │  data_level0.sst, data_level1.sst   │    │
#  │  │  (actual vectors stored here)        │    │
#  │  └──────────────────────────────────────┘    │
#  └──────────────────────────────────────────────┘
#  → Program restart chessinappudu data still there
#  → Code: Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
#
# ─────────────────────────────────────────────────────────────────────────────
# HOW CHROMA STORES VECTORS — Step by Step
# ─────────────────────────────────────────────────────────────────────────────
#
#  Chroma.from_documents(documents=chunks, embedding=embeddings) lo:
#
#  Step 1: Each chunk ki unique ID generate chestundi
#          chunk_0, chunk_1, chunk_2 ... (UUID format)
#
#  Step 2: embeddings.embed_documents() call chestundi — batch embed
#          ["chunk1 text", "chunk2 text", ...] → [[0.12,...], [0.34,...], ...]
#
#  Step 3: Internal SQLite table lo store chestundi:
#          ┌──────────────┬──────────────────────┬──────────────────┐
#          │ id           │ document (text)       │ metadata         │
#          ├──────────────┼──────────────────────┼──────────────────┤
#          │ "chunk_uuid1"│ "April 2024-Present.."│ {source: pdf, p:2}│
#          │ "chunk_uuid2"│ "HeartCentrix, DFW.." │ {source: pdf, p:3}│
#          │ "chunk_uuid3"│ "Java, Python, Selen."│ {source: pdf, p:1}│
#          └──────────────┴──────────────────────┴──────────────────┘
#
#  Step 4: Vectors separate HNSW index lo store chestundi:
#          HNSW = Hierarchical Navigable Small World graph
#          ┌───────────────────────────────────────────────┐
#          │  HNSW Graph (approximate nearest neighbor)    │
#          │                                               │
#          │  chunk_uuid1 ──── chunk_uuid3                │
#          │       │                │                      │
#          │  chunk_uuid2 ──────────┘                     │
#          │  (vectors connected by similarity)           │
#          └───────────────────────────────────────────────┘
#
# ─────────────────────────────────────────────────────────────────────────────
# HOW CHROMA RETRIEVES — Cosine Similarity Search
# ─────────────────────────────────────────────────────────────────────────────
#
#  retriever.invoke("What is current company?") chessinappudu:
#
#  Step 1: Question embed chestundi
#          "What is current company?" → [0.45, -0.12, 0.78, ...] (384 dims)
#
#  Step 2: HNSW graph traverse chestundi — approximate nearest neighbor search
#          (Full comparison kante 10-100x faster — approximate but very accurate)
#
#  Step 3: Cosine similarity calculate chestundi each candidate tho:
#
#          Cosine similarity formula:
#          similarity = (A · B) / (||A|| × ||B||)
#          A · B = dot product (dimension wise multiply + sum)
#          ||A|| = magnitude of vector A
#
#          Example:
#          question = [0.45, -0.12, 0.78]  (simplified 3-dim for clarity)
#          chunk1   = [0.44, -0.11, 0.76]
#          chunk2   = [0.12,  0.67, 0.23]
#
#          dot(q, chunk1) = (0.45×0.44) + (-0.12×-0.11) + (0.78×0.76) = 0.802
#          dot(q, chunk2) = (0.45×0.12) + (-0.12×0.67) + (0.78×0.23) = 0.107
#
#          similarity(q, chunk1) = 0.97  ← very close! ✅ retrieved
#          similarity(q, chunk2) = 0.31  ← unrelated   ✗ skipped
#
#  Step 4: Top k=3 highest similarity chunks return chestundi
#
# ─────────────────────────────────────────────────────────────────────────────
# CHROMA SETUP — What's needed (nothing extra!)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Setup:     pip install langchain-chroma  (already installed ✅)
#  Server:    ❌ Not needed — runs inside Python process
#  Config:    ❌ Not needed — zero configuration
#  API key:   ❌ Not needed — completely free and local
#  Database:  ❌ Not needed — creates in-memory collection automatically
#
#  Compare with other vector DBs:
#  ┌──────────────┬────────────┬──────────┬──────────┬───────────────────┐
#  │ Vector DB    │ Server     │ Setup    │ Cost     │ Best for          │
#  ├──────────────┼────────────┼──────────┼──────────┼───────────────────┤
#  │ Chroma       │ ❌ No      │ pip only │ Free     │ Learning, local   │
#  │ FAISS        │ ❌ No      │ pip only │ Free     │ Large scale local │
#  │ Pinecone     │ ✅ Cloud   │ Signup   │ Paid     │ Production cloud  │
#  │ Weaviate     │ ✅ Yes     │ Docker   │ Free/Pay │ Production local  │
#  │ Qdrant       │ ✅ Yes     │ Docker   │ Free/Pay │ Production local  │
#  └──────────────┴────────────┴──────────┴──────────┴───────────────────┘
#  → Chroma = easiest setup, perfect for RAG learning ✅
#
# ─────────────────────────────────────────────────────────────────────────────
# WHAT'S STORED INSIDE CHROMA — Complete Picture
# ─────────────────────────────────────────────────────────────────────────────
#
#  For each Document chunk, Chroma stores:
#
#  ┌─────────────────────────────────────────────────────────────────┐
#  │  WHAT              │  EXAMPLE                                   │
#  ├─────────────────────────────────────────────────────────────────┤
#  │  id                │  "a1b2c3d4-e5f6-..."   (UUID auto-gen)     │
#  │  document (text)   │  "April 2024 Present\nHeartCentrix..."     │
#  │  embedding (vector)│  [0.12, -0.45, 0.87, ...] (384 numbers)   │
#  │  metadata          │  {"source": "resume.pdf", "page": 2}      │
#  └─────────────────────────────────────────────────────────────────┘
#
#  When you retrieve: both text AND metadata return chestay
#  doc.page_content = text
#  doc.metadata     = {"source": "resume.pdf", "page": 2}
#
# ─────────────────────────────────────────────────────────────────────────────
# LARGE DATA AITHE RAM MANAGE ELA CHESTUNDI? — Critical Question
# ─────────────────────────────────────────────────────────────────────────────
#
#  Short answer: In-memory Chroma CANNOT handle very large data.
#  RAM finite — millions of vectors RAM lo fit avvavu.
#  Solution oka kaadu — data size base ga different approach untundi.
#
#  REAL NUMBERS — How much RAM per chunk:
#
#  ┌────────────────┬──────────────┬──────────────────────────────────────┐
#  │  Dims          │  RAM/chunk   │  1 million chunks = ?                │
#  ├────────────────┼──────────────┼──────────────────────────────────────┤
#  │  384  (HF)     │  1.5 KB      │  ~1.5 GB RAM                         │
#  │  768  (Ollama) │  3.0 KB      │  ~3.0 GB RAM                         │
#  │  1536 (OpenAI) │  6.0 KB      │  ~6.0 GB RAM                         │
#  └────────────────┴──────────────┴──────────────────────────────────────┘
#
#  Our resume RAG (12 pages, ~80 chunks):
#    80 × 1.5KB = ~120KB RAM  → no problem ✅
#
#  100 PDFs (1000 pages, ~8000 chunks):
#    8000 × 1.5KB = ~12MB RAM  → fine ✅
#
#  1 million documents (huge corpus):
#    1,000,000 × 1.5KB = ~1.5GB RAM → problem ❌ (most machines 8-16GB total)
#
# ─────────────────────────────────────────────────────────────────────────────
#  SOLUTION 1 — Persistent Chroma (disk instead of RAM)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Persistent mode lo Chroma vectors disk lo store chestundi.
#  RAM lo only "active working set" load chestundi — full data disk lo untundi.
#
#  Code change (in ask_from_docs or setup):
#
#  # One-time indexing (run once, takes time):
#  vectorstore = Chroma.from_documents(
#      documents=chunks,
#      embedding=embeddings,
#      persist_directory="./chroma_db"   # ← this line adds disk persistence
#  )
#  # chroma_db/ folder create avutundi — sqlite3 + vector files
#  # Program close chessinappudu data survives ✅
#
#  # Every next run — reload from disk (no re-embedding needed):
#  vectorstore = Chroma(
#      persist_directory="./chroma_db",
#      embedding_function=embeddings
#  )
#  retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
#  # Instant load — embedding step skip avutundi ✅
#
#  Disk lo data untundi — RAM lo only search time lo needed data load avutundi.
#  Chroma internally memory-mapped files use chestundi for efficient access.
#
# ─────────────────────────────────────────────────────────────────────────────
#  SOLUTION 2 — FAISS with memory mapping (millions of vectors)
# ─────────────────────────────────────────────────────────────────────────────
#
#  FAISS = Facebook AI Similarity Search — Meta develop chesina library
#  Memory-mapped files use chestundi → disk nundi RAM lo directly access
#  RAM kante ekkuva data handle cheyyagaladadu without loading everything
#
#  from langchain_community.vectorstores import FAISS
#
#  # Build index (one time):
#  vectorstore = FAISS.from_documents(chunks, embeddings)
#  vectorstore.save_local("./faiss_index")
#
#  # Reload next run:
#  vectorstore = FAISS.load_local("./faiss_index", embeddings,
#                                  allow_dangerous_deserialization=True)
#
#  Handles millions of vectors efficiently on normal machines ✅
#
# ─────────────────────────────────────────────────────────────────────────────
#  SOLUTION 3 — Cloud Vector DB (Pinecone, Weaviate) for very large scale
# ─────────────────────────────────────────────────────────────────────────────
#
#  Billions of vectors → cloud vector DB only option
#
#  Pinecone example:
#  from langchain_pinecone import PineconeVectorStore
#
#  vectorstore = PineconeVectorStore.from_documents(
#      documents=chunks,
#      embedding=embeddings,
#      index_name="my-rag-index"   # Pinecone cloud lo index
#  )
#  # Data Pinecone servers lo — your RAM zerou use
#  # Distributed storage, auto-scaling, billions of vectors ✅
#
# ─────────────────────────────────────────────────────────────────────────────
#  DECISION GUIDE — Which to use when
# ─────────────────────────────────────────────────────────────────────────────
#
#  Data size              │ Solution                  │ Why
#  ───────────────────────┼───────────────────────────┼───────────────────────
#  < 50,000 chunks        │ Chroma in-memory           │ Simple, fast, no setup
#  50K - 500K chunks      │ Chroma persistent (disk)   │ Survives restart, free
#  500K - 5M chunks       │ FAISS (memory-mapped)      │ Fast, memory efficient
#  5M+ chunks             │ Pinecone / Weaviate cloud  │ Distributed, scalable
#  ───────────────────────┴───────────────────────────┴───────────────────────
#
#  Our resume RAG = ~80 chunks → in-memory Chroma perfect ✅
#  Company knowledge base (100 PDFs) = ~8000 chunks → Chroma persistent ✅
#  Wikipedia (6M articles) = ~100M chunks → Pinecone ✅
#
# ─────────────────────────────────────────────────────────────────────────────
#  HNSW — How Search Stays Fast Even With Large Data
# ─────────────────────────────────────────────────────────────────────────────
#
#  Brute force search: compare question with EVERY vector
#    1M vectors × 384 multiplications = 384M operations per query
#    Slow: ~seconds per search
#
#  HNSW (what Chroma uses): graph-based approximate search
#    Only compare with ~few hundred candidate vectors (not all 1M)
#    ~99% accuracy, 100x faster
#
#  HNSW graph structure:
#  ┌──────────────────────────────────────────────────────────┐
#  │  Layer 2 (sparse):    A ─────────────── D               │
#  │  Layer 1 (medium):    A ─── B ─── C ─── D               │
#  │  Layer 0 (full):      A─B─C─D─E─F─G─H─I─J─K─L─M        │
#  └──────────────────────────────────────────────────────────┘
#  Search starts at top (sparse layer), quickly narrows down,
#  then searches exact area in bottom (full layer)
#  → Like binary search but for high-dimensional vectors
#
# =============================================================================
# FAISS — Alternative to ChromaDB (Facebook AI Similarity Search)
# =============================================================================
#
# "Facebook AI Similarity Search (FAISS) is a library for efficient similarity
#  search and clustering of dense vectors. It contains algorithms that search
#  in sets of vectors of any size, up to ones that possibly do not fit in RAM.
#  It also contains supporting code for evaluation and parameter tuning."
#                                                   — Meta AI (original authors)
#
# FAISS = Meta (Facebook) develop chesina library for fast vector search
# Open-source, free, runs locally — no server needed
#
# ─────────────────────────────────────────────────────────────────────────────
#  FAISS vs CHROMA — Key Differences
# ─────────────────────────────────────────────────────────────────────────────
#
#  Feature              │ Chroma                    │ FAISS
#  ─────────────────────┼───────────────────────────┼──────────────────────────
#  Made by              │ Chroma AI startup         │ Meta (Facebook)
#  Primary use          │ Full-featured vector DB   │ Pure vector search library
#  Storage              │ SQLite + HNSW index       │ Custom binary index files
#  Metadata storage     │ ✅ Built-in (SQLite)       │ ⚠️  Manual (store separately)
#  Persistence          │ Optional persist_directory│ save_local() / load_local()
#  RAM handling         │ Loads all into RAM        │ Memory-mapped (disk→RAM lazy)
#  Scale                │ Up to ~500K vectors well  │ Millions to billions ✅
#  Search algorithms    │ HNSW only                 │ Multiple: Flat, IVF, HNSW, PQ
#  Speed (small data)   │ Similar                   │ Similar
#  Speed (large data)   │ Slower                    │ Much faster ✅
#  Setup                │ pip install langchain-chroma │ pip install faiss-cpu
#  Server               │ ❌ None needed             │ ❌ None needed
#  API key              │ ❌ None needed             │ ❌ None needed
#  ─────────────────────┴───────────────────────────┴──────────────────────────
#
#  Simple rule:
#  → Small/medium data + metadata queries → Chroma ✅
#  → Large data + pure search speed       → FAISS  ✅
#
# ─────────────────────────────────────────────────────────────────────────────
#  FAISS SEARCH ALGORITHMS — Multiple options (Chroma has only HNSW)
# ─────────────────────────────────────────────────────────────────────────────
#
#  IndexFlatL2 / IndexFlatIP — Exact search (brute force)
#    → Compares question vector with EVERY stored vector
#    → 100% accurate — no approximation
#    → Slow for large data, fast for small (<100K vectors)
#    → Use: small datasets where 100% accuracy required
#
#  IndexIVFFlat — Inverted File Index (approximate)
#    → Vectors ni clusters lo group chestundi (like sorting books by genre)
#    → Search time lo only relevant clusters check chestundi
#    → 10-100x faster than Flat, ~95-99% accuracy
#    → Use: millions of vectors
#
#  IndexHNSW — Same as Chroma uses
#    → Graph-based, fast approximate search
#    → Good balance of speed + accuracy
#
#  IndexPQ — Product Quantization (compressed vectors)
#    → Vectors ni compress chestundi — less memory
#    → 4-8x less RAM, slightly lower accuracy
#    → Use: RAM limited systems with huge datasets
#
# ─────────────────────────────────────────────────────────────────────────────
#  FAISS — How to Use (Drop-in replacement for Chroma)
# ─────────────────────────────────────────────────────────────────────────────
#
#  Install:
#    pip install faiss-cpu             ← CPU version (works everywhere)
#    pip install faiss-gpu             ← GPU version (faster, needs NVIDIA GPU)
#    pip install langchain-community   ← already installed ✅
#
#  CODE — In-memory (same as current Chroma usage):
#
#  from langchain_community.vectorstores import FAISS
#
#  # Build index — same call as Chroma.from_documents()
#  vectorstore = FAISS.from_documents(
#      documents=chunks,         # same chunks
#      embedding=embeddings      # same HuggingFace/Ollama embeddings
#  )
#  retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
#  relevant_docs = retriever.invoke(question)
#  # Everything else same ✅ — ask_from_docs() rest unchanged
#
#  CODE — Persistent (save to disk, reload next run):
#
#  # Save (one time after building):
#  vectorstore.save_local("./faiss_index")
#  # Creates: faiss_index/index.faiss + faiss_index/index.pkl
#
#  # Load next run (skip embedding step — instant):
#  from langchain_community.vectorstores import FAISS
#  vectorstore = FAISS.load_local(
#      "./faiss_index",
#      embeddings,
#      allow_dangerous_deserialization=True  # security flag for loading pkl files
#  )
#  retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
#
# ─────────────────────────────────────────────────────────────────────────────
#  HOW FAISS HANDLES DATA LARGER THAN RAM
# ─────────────────────────────────────────────────────────────────────────────
#
#  Memory-mapped files (mmap):
#    → Index file disk lo untundi (e.g. 10GB faiss_index/index.faiss)
#    → RAM lo full load cheyyadu
#    → OS file pages use chestundi — only accessed pages RAM lo untay
#    → Search chessinappudu relevant pages only RAM lo load avutay (lazy loading)
#    → RAM 4GB aina 10GB index use cheyyachu ✅
#
#  Analogy:
#    Book library — every book shelf lo untundi.
#    Chroma: anni books table mida spread out chestundi (RAM)
#    FAISS:  shelf nundi only needed book teesukuntundi (lazy mmap)
#
# ─────────────────────────────────────────────────────────────────────────────
#  SWITCHING FROM CHROMA TO FAISS — 3 line change in ask_from_docs()
# ─────────────────────────────────────────────────────────────────────────────
#
#  Current (Chroma):
#    vectorstore = Chroma.from_documents(documents=chunks, embedding=embeddings)
#
#  Switch to FAISS:
#    from langchain_community.vectorstores import FAISS
#    vectorstore = FAISS.from_documents(documents=chunks, embedding=embeddings)
#
#  Everything else (retriever, invoke, context building) same ✅
#  LangChain common interface power — vectorstore swap chesthe pipeline works!
#
# ─────────────────────────────────────────────────────────────────────────────
#  FAISS SPECIFIC — similarity_search_with_score
# ─────────────────────────────────────────────────────────────────────────────
#
#  "There are some FAISS specific methods. One of them is
#   similarity_search_with_score, which allows you to return not only the
#   documents but also the distance score of the query to them.
#   The returned distance score is L2 distance. Therefore, a lower score
#   is better."
#
#  Normal retriever.invoke() — only documents return chestundi (no score)
#  similarity_search_with_score() — documents + score rendu return chestundi
#
#  L2 distance (Euclidean distance) ante enti?
#    → Rendu vectors madhya "straight line" distance
#    → Chinna number = vectors close = similar meaning ✅
#    → Pedda number = vectors far = dissimilar meaning ✗
#    → 0.0 = identical vectors (same text)
#    → Unlike cosine similarity (higher = better), L2 = lower is better
#
#  CODE — similarity_search_with_score():
#
#  from langchain_community.vectorstores import FAISS
#
#  vectorstore = FAISS.from_documents(chunks, embeddings)
#
#  # Returns: List of (Document, score) tuples
#  results = vectorstore.similarity_search_with_score(
#      "What is the current company?",
#      k=3   # top 3 results
#  )
#
#  for doc, score in results:
#      print(f"Score: {score:.4f}")          # L2 distance — lower is better
#      print(f"Content: {doc.page_content}") # actual chunk text
#      print(f"Source: {doc.metadata}")      # metadata (page, source file)
#      print("---")
#
#  Example output:
#  Score: 0.1823   ← very close (low L2 = high similarity) ✅
#  Content: April 2024 - Present | Test Automation Engineer | HeartCentrix...
#  Source: {'source': 'resume.pdf', 'page': 2}
#  ---
#  Score: 0.3421   ← somewhat relevant
#  Content: Responsibilities: Developed and maintained automated tests...
#  Source: {'source': 'resume.pdf', 'page': 3}
#  ---
#  Score: 0.8934   ← less relevant (higher L2 = less similar)
#  Content: Skills: Java, Python, Selenium, Cucumber...
#  Source: {'source': 'resume.pdf', 'page': 1}
#
#  WHY USE SCORE?
#  → Relevance filtering — score > threshold aithe skip cheyyachu
#  → Debugging — which chunks actually relevant undo chudachu
#  → Quality check — all scores high (bad match) → question ki answer ledu
#
#  Example with threshold filter:
#  results = vectorstore.similarity_search_with_score("question", k=5)
#  relevant = [(doc, score) for doc, score in results if score < 0.5]
#  # Only chunks with L2 distance < 0.5 (close enough) keep chestam
#
#  Chroma equivalent (cosine similarity — higher is better):
#  # Chroma lo score filter cheyyatam differently — score range 0 to 1
#  # FAISS L2: 0 best, ∞ worst
#  # Chroma cosine: 1 best, 0 worst
#
# =============================================================================

# Prompt template build cheyyadaniki.
from langchain_core.prompts import ChatPromptTemplate
# ChatPromptTemplate — LLM ki pampalsina message ni template ga define cheyyadam
# {context} and {question} placeholders — runtime lo actual values fill avutay
# System instructions + user question oka structure lo combine chestundi

# Final output ni clean string ga parse cheyyadaniki.
from langchain_core.output_parsers import StrOutputParser
# StrOutputParser — LLM response object nundi plain text extract chestundi
# LLM response lo metadata, tokens, role anni untay
# StrOutputParser → only .content (clean answer text) return chestundi

# ── .env file load logic ─────────────────────────────────────────────────────
# First try local .env (same folder as this file), then fallback to workspace LangChain/.env.
local_env = Path(__file__).with_name(".env")
# Path(__file__)           → helper.py ki full path (e.g. C:\learnAi\RAG\loaders\helper.py)
# .with_name(".env")       → same folder lo ".env" file path create chestundi
#                          → C:\learnAi\RAG\loaders\.env

fallback_env = Path(__file__).resolve().parents[2] / "LangChain" / ".env"
# .resolve()               → absolute path (symlinks resolve chesi)
# .parents[2]              → 3 levels up from helper.py
#                          → helper.py is at: RAG/loaders/helper.py
#                          → parents[0] = RAG/loaders/
#                          → parents[1] = RAG/
#                          → parents[2] = learnAi/   (repo root)
# / "LangChain" / ".env"  → learnAi/LangChain/.env  (where actual keys are)

if local_env.exists():
    # local_env.exists() → RAG/loaders/.env file unda ani check chestundi
    load_dotenv(dotenv_path=local_env)
    # dotenv_path= → specific file nundi load cheyyadam (default: CWD .env)
elif fallback_env.exists():
    # local .env lekapothe → workspace level LangChain/.env try chestundi
    load_dotenv(dotenv_path=fallback_env)
else:
    load_dotenv()
    # No specific path → current working directory lo .env search chestundi

# ── LLM setup ────────────────────────────────────────────────────────────────
#
# =============================================================================
# WHAT IS ChatGroq?
# =============================================================================
#
# ChatGroq = 2 things combined — understand both:
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  PART 1: Groq (the company + hardware)                                  │
# ├─────────────────────────────────────────────────────────────────────────┤
# │                                                                          │
# │  Groq = AI infrastructure company — models ni run cheyyadaniki          │
# │         custom hardware (LPU) build chesindi                            │
# │                                                                          │
# │  LPU = Language Processing Unit                                         │
# │  → GPU (NVIDIA) — general purpose, matrix math ki optimized             │
# │  → LPU (Groq)   — specifically LLM inference ki designed                │
# │                                                                          │
# │  Speed comparison (tokens per second):                                  │
# │  → OpenAI GPT-4 (GPU):  ~30-50 tokens/sec                              │
# │  → Groq (LPU):          ~300-500 tokens/sec  ← 10x faster!             │
# │                                                                          │
# │  Groq = LLM models run cheyyadaniki fast cloud API                     │
# │  Groq itself models train cheyyadu — other companies' models run chestundi│
# │                                                                          │
# │  ⚠️  Groq ≠ Google  (common confusion!)                                  │
# │  Groq = different company, LPU hardware, LLM inference focused          │
# │  Google = search, Android, Bard/Gemini                                  │
# │                                                                          │
# │  Groq lo run avye models (examples):                                    │
# │  → llama-3.3-70b-versatile   (Meta's Llama)                            │
# │  → mixtral-8x7b              (Mistral AI)                               │
# │  → gemma2-9b-it              (Google's Gemma)                           │
# │  → qwen/qwen3.6-27b          (Alibaba's Qwen) ← we use this            │
# │                                                                          │
# │  Free tier: limited requests/minute, enough for learning                │
# │  API key: GROQ_API_KEY (console.groq.com nundi get cheyyi)             │
# └─────────────────────────────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  PART 2: ChatGroq (the LangChain class)                                 │
# ├─────────────────────────────────────────────────────────────────────────┤
# │                                                                          │
# │  ChatGroq = LangChain library lo Groq API ki connector class            │
# │                                                                          │
# │  LangChain lo different LLM providers ki different classes unnay:       │
# │  → ChatGroq        (Groq API)                                           │
# │  → ChatOpenAI      (OpenAI API)                                         │
# │  → ChatAnthropic   (Anthropic/Claude API)                               │
# │  → ChatOllama      (Local Ollama server)                                │
# │  → ChatGoogleGenerativeAI  (Google Gemini)                              │
# │                                                                          │
# │  Anni same interface follow chestay:                                     │
# │  llm.invoke("question")  → answer                                       │
# │  Provider switch chessinappudu code rest change avvadu ✅                │
# │                                                                          │
# │  ChatGroq internally chesthundi:                                         │
# │  1. GROQ_API_KEY tho authenticate                                        │
# │  2. HTTP POST → api.groq.com/openai/v1/chat/completions                │
# │  3. Model name, messages, temperature pass chestundi                    │
# │  4. Groq LPU server model run chesi token-by-token response pampi       │
# │  5. LangChain response object ga wrap chesi return chestundi            │
# └─────────────────────────────────────────────────────────────────────────┘
#
# Flow:
#   Your code          Groq Cloud
#   ChatGroq.invoke()  →  api.groq.com  →  LPU hardware  →  qwen model
#                      ←  answer text   ←  fast response  ←
#
# =============================================================================

# LLM create chestunnam. temperature=0.3 ante balanced creativity.
# ─────────────────────────────────────────────────────────────────────────────
# PROVIDER CHOICE — uncomment one block, comment the other
# ─────────────────────────────────────────────────────────────────────────────

# OPTION A — Groq (cloud, fast, needs API key + internet)  ← CURRENTLY ACTIVE
from langchain_groq import ChatGroq
llm = ChatGroq(
    model="qwen/qwen3.6-27b",
    # model — Groq lo run avutunna LLM name
    # "qwen/qwen3.6-27b" — Alibaba's Qwen model, 27 billion parameters
    # Groq idi fast ga run chestundi (LPU hardware use chesi)
    temperature=0.3,
    # temperature — LLM output randomness control cheyyadam
    # 0.0 → deterministic, always same answer (factual tasks ki)
    # 1.0 → creative, varied answers (creative writing ki)
    # 0.3 → balanced — mostly factual with slight variation
)

# OPTION B — Ollama (local, offline, no API key, total privacy)  ← READY TO USE
# Ollama installed ✅  |  llama3.2 pulled ✅  |  pip install langchain-ollama ✅
# To switch: comment OPTION A above, uncomment 3 lines below
# from langchain_ollama import ChatOllama
# llm = ChatOllama(model="llama3.2", temperature=0.3)
# (no API key needed, works offline, data never leaves your machine)

# ── Embeddings setup ─────────────────────────────────────────────────────────
#
# =============================================================================
# WHAT ARE EMBEDDINGS? — And 3 ways to get them
# =============================================================================
# Embedding ante enti?
#   Text ni numbers (floating point vector) ga convert cheyyadam.
#   Similar meaning unna texts → similar numbers → similarity search possible.
#
#   "I love programming"  → [0.12, -0.45, 0.87, 0.33, ...]  (384 numbers)
#   "I enjoy coding"      → [0.11, -0.43, 0.85, 0.31, ...]  (similar!)
#   "I hate vegetables"   → [0.89,  0.34, -0.22, 0.71, ...] (different)
#
#   RAG lo use:
#     chunks ni embed chestam → vectorstore lo store
#     question ni embed chestam → vectorstore lo similar chunks vetukuntam
#
# =============================================================================
# WHAT ARE DIMENSIONS? — With Real Examples
# =============================================================================
#
# "Dimensions" ante vector lo unna numbers count.
#
#   384-dim vector  → oka text ni 384 numbers tho represent cheyyadam
#   768-dim vector  → oka text ni 768 numbers tho represent cheyyadam
#   1536-dim vector → oka text ni 1536 numbers tho represent cheyyadam
#
# ─────────────────────────────────────────────────────────────────────────────
# REAL EXAMPLE — "The cat sat on the mat"
# ─────────────────────────────────────────────────────────────────────────────
#
#  HuggingFace (384-dim):
#  [0.123, -0.456, 0.789, 0.034, -0.211, 0.567, ...(379 more numbers)...]
#   ↑dim1   ↑dim2   ↑dim3   ↑dim4   ↑dim5   ↑dim6
#   total: 384 numbers
#
#  Ollama nomic-embed-text (768-dim):
#  [0.234, -0.123, 0.891, 0.045, -0.312, 0.678, ...(762 more numbers)...]
#   total: 768 numbers  (2x more than HuggingFace)
#
#  OpenAI text-embedding-3-small (1536-dim):
#  [0.345, -0.234, 0.912, 0.056, -0.413, 0.789, ...(1530 more numbers)...]
#   total: 1536 numbers  (4x more than HuggingFace)
#
# ─────────────────────────────────────────────────────────────────────────────
# WHAT DOES EACH NUMBER REPRESENT?
# ─────────────────────────────────────────────────────────────────────────────
#
#  Each dimension captures some "feature" of the text meaning.
#  Exact meaning of each number is not human-readable —
#  model training lo automatically learned avutundi.
#
#  Think of it as coordinates in multi-dimensional space:
#
#  2D space (simple example with 2 dims only):
#
#         Animal axis
#             │
#         1.0 │   🐱 cat [0.9, 0.8]
#             │   🐶 dog [0.8, 0.7]
#         0.5 │
#             │
#         0.0 ─────────────────── Soft/Fluffy axis
#             0.0    0.5    1.0
#
#  "cat" and "dog" → close together (similar animals) ✅
#  "cat" and "car" → far apart (nothing in common) ✅
#
#  Real models do this in 384/768/1536 dimensions simultaneously —
#  capturing grammar, topic, sentiment, style, meaning all at once.
#
# ─────────────────────────────────────────────────────────────────────────────
# DO MORE DIMENSIONS = BETTER?
# ─────────────────────────────────────────────────────────────────────────────
#
#  Usually yes, but with trade-offs:
#
#  Dimensions │ Model                    │ Quality  │ Speed  │ Storage
#  ───────────┼──────────────────────────┼──────────┼────────┼──────────
#  384        │ HuggingFace all-MiniLM   │ Good     │ Fast   │ Small
#  768        │ Ollama nomic-embed-text  │ Better   │ Medium │ 2x
#  1024       │ Ollama mxbai-embed-large │ Better+  │ Slower │ 3x
#  1536       │ OpenAI text-emb-3-small  │ Best     │ Fast*  │ 4x
#  3072       │ OpenAI text-emb-3-large  │ Best++   │ Fast*  │ 8x
#  ───────────┴──────────────────────────┴──────────┴────────┴──────────
#  *OpenAI fast because it's their own hardware
#
#  For RAG (finding similar chunks):
#  → 384 dims: works well for most tasks ✅
#  → 768 dims: slightly better accuracy, especially for longer texts
#  → 1536+ dims: better for nuanced meaning (legal, medical, technical docs)
#
# ─────────────────────────────────────────────────────────────────────────────
# COSINE SIMILARITY — How dimensions help find relevant chunks
# ─────────────────────────────────────────────────────────────────────────────
#
#  Cosine similarity = angle between two vectors (0 to 1)
#  1.0 = identical meaning  |  0.0 = completely unrelated
#
#  Example with our resume RAG:
#
#  question vector:  "current company?" → [0.45, -0.12, 0.78, ...]
#  chunk7 vector:    "HeartCentrix, April 2024 Present" → [0.44, -0.11, 0.76, ...]
#  chunk2 vector:    "Python, Java, Selenium skills" → [0.12,  0.67, 0.23, ...]
#
#  cosine_similarity(question, chunk7) = 0.97  ← very similar! ✅ retrieved
#  cosine_similarity(question, chunk2) = 0.31  ← unrelated     ✗ skipped
#
#  More dimensions → more precise angle calculation → better match accuracy
#
# ─────────────────────────────────────────────────────────────────────────────
# PRACTICAL IMPACT IN THIS PROJECT
# ─────────────────────────────────────────────────────────────────────────────
#
#  HuggingFace (384 dims) — current:
#    chunk vector size:    384 floats × 4 bytes = 1,536 bytes per chunk
#    50 chunks from PDF:   50 × 1,536 = ~75KB in Chroma memory
#    Similarity search:    384 multiplications per comparison — very fast
#
#  Ollama nomic-embed-text (768 dims):
#    chunk vector size:    768 floats × 4 bytes = 3,072 bytes per chunk
#    50 chunks from PDF:   50 × 3,072 = ~150KB in Chroma memory
#    Similarity search:    768 multiplications per comparison — slightly slower
#    Better quality:       More nuanced similarity detection
#
#  For learning/dev with resume PDFs → 384 dims is perfectly fine ✅
#  For production with 10,000+ chunks → consider 768/1536 for better accuracy
#
# 3 POPULAR EMBEDDING PROVIDERS:
# =============================================================================
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  OPTION 1 — OpenAI Embeddings (paid, cloud)                             │
# ├─────────────────────────────────────────────────────────────────────────┤
# │  from langchain_openai import OpenAIEmbeddings                          │
# │  embeddings = OpenAIEmbeddings(model="text-embedding-3-small")          │
# │                                                                          │
# │  What it is: OpenAI's embedding API — text-embedding-3-small/large      │
# │  How it works: Text ni OpenAI server ki pampi, vector return teesukuntam │
# │  Dimensions: 1536 (small) / 3072 (large)                                │
# │  Quality: ✅ Excellent — industry standard                               │
# │  Speed: ✅ Fast API call                                                  │
# │  Cost: ❌ Paid — per token charge ($0.02 per 1M tokens for small)        │
# │  Privacy: ❌ Data OpenAI servers ki velthundi                             │
# │  Requires: OPENAI_API_KEY in .env                                        │
# │                                                                          │
# │  Best for: Production apps, high quality needed, cost no concern         │
# └─────────────────────────────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  OPTION 2 — Ollama Embeddings (free, local, private)                    │
# ├─────────────────────────────────────────────────────────────────────────┤
# │  from langchain_ollama import OllamaEmbeddings                          │
# │  embeddings = OllamaEmbeddings(model="nomic-embed-text")                │
# │                                                                          │
# │  What it is: Ollama = local LLM server, runs models on your machine     │
# │  How it works: Local Ollama server call chestundi (localhost:11434)      │
# │  Dimensions: varies by model (nomic-embed-text: 768 dims)               │
# │  Quality: ✅ Good — decent for most tasks                                │
# │  Speed: ⚠️  Slower than API (GPU/CPU depends on machine)                 │
# │  Cost: ✅ Free — runs locally, no API charges                            │
# │  Privacy: ✅ Data never leaves your machine                               │
# │  Requires: Ollama installed + model pulled (ollama pull nomic-embed-text)│
# │                                                                          │
# │  Best for: Private data, no internet, cost-sensitive projects            │
# └─────────────────────────────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  OPTION 3 — HuggingFace Embeddings (free, local) ← WE USE THIS         │
# ├─────────────────────────────────────────────────────────────────────────┤
# │                                                                          │
# │  ⚠️  COMMON CONFUSION: HuggingFace oka single model kaadu!              │
# │                                                                          │
# │  HuggingFace = 3 things in one:                                          │
# │                                                                          │
# │  1) COMPANY — San Francisco lo unna AI startup (founded 2016)           │
# │               "GitHub of AI" ani pilu staru                             │
# │                                                                          │
# │  2) PLATFORM / HUB (huggingface.co)                                     │
# │     → 1,000,000+ models publicly available (anyone upload cheyyachu)    │
# │     → 500,000+ datasets                                                  │
# │     → Spaces (demo apps)                                                 │
# │     → GitHub laaga — developers models share, download, version chestay │
# │     → Models: Meta's Llama, Google's Gemma, Mistral, BERT, GPT-2 etc.   │
# │       anni HuggingFace Hub lo available                                  │
# │                                                                          │
# │  3) PYTHON LIBRARIES (open source)                                       │
# │     → transformers      : LLM models load + run cheyyadaniki            │
# │     → sentence-transformers : text embeddings generate cheyyadaniki     │
# │     → datasets          : datasets download + process cheyyadaniki      │
# │     → diffusers         : image generation models                       │
# │     → tokenizers        : fast text tokenization                        │
# │                                                                          │
# │  Analogy:                                                                │
# │  → GitHub = developers ki code share/download platform                  │
# │  → HuggingFace = AI researchers ki model/dataset share/download platform│
# │                                                                          │
# │  So "HuggingFace Embeddings" ante:                                      │
# │  → HuggingFace Hub nundi oka embedding model download chesi             │
# │  → HuggingFace's sentence-transformers library tho locally run cheyyadam│
# │  → Model: "sentence-transformers/all-MiniLM-L6-v2"                     │
# │    (HuggingFace Hub lo unna model — sentence-transformers org upload)   │
# │                                                                          │
# │  What it is: HuggingFace Hub nundi model download chesi locally run     │
# │  How it works: Python lo directly run (no server needed)                 │
# │  Dimensions: 384 (all-MiniLM-L6-v2)                                    │
# │  Quality: ✅ Good for general text — especially semantic search          │
# │  Speed: ✅ Fast after first download (cached locally)                    │
# │  Cost: ✅ Completely free                                                 │
# │  Privacy: ✅ Data stays local                                             │
# │  Model size: ~22MB — very lightweight                                    │
# │  Requires: pip install langchain-huggingface sentence-transformers       │
# │            First run: model auto-download from HuggingFace Hub          │
# │                                                                          │
# │  Best for: Learning, development, free projects, general text similarity │
# └─────────────────────────────────────────────────────────────────────────┘
#
# =============================================================================
# COMPARISON TABLE
# =============================================================================
#
#  Provider       | Type    | Dims | Quality | Cost  | Privacy | Requires
#  ─────────────────────────────────────────────────────────────────────────
#  OpenAI         | Cloud   | 1536 | Best    | Paid  | ❌ Cloud | API key
#  Ollama         | Local   | 768  | Good    | Free  | ✅ Local | Ollama app
#  HuggingFace    | Local   | 384  | Good    | Free  | ✅ Local | pip install
#  ─────────────────────────────────────────────────────────────────────────
#
#  Mana choice: HuggingFace → free, local, no API key needed, learning ki perfect
#
# =============================================================================
# HOW ARE WE USING HuggingFace WITHOUT AN API KEY?
# =============================================================================
#
#  Excellent question! Ikkada oka very important concept untundi.
#
#  HuggingFace = 2 completely different ways to use models:
#
#  WAY 1 — HuggingFace API / Inference API (needs API key)
#  ┌─────────────────────────────────────────────────────────────────────────┐
#  │  Your code  →  HTTP request  →  HuggingFace servers  →  response      │
#  │                                                                          │
#  │  Like OpenAI — API call, needs key, data goes to their servers          │
#  │  Used for: running LARGE models (70B+) that won't fit on your machine  │
#  │  Requires: HUGGINGFACE_API_KEY / HF_TOKEN in .env                      │
#  └─────────────────────────────────────────────────────────────────────────┘
#
#  WAY 2 — sentence-transformers library (NO API key) ← WE USE THIS
#  ┌─────────────────────────────────────────────────────────────────────────┐
#  │  Your code  →  Python process  →  local model weights  →  vectors      │
#  │                                                                          │
#  │  No API call at all — model runs inside YOUR Python process             │
#  │  Like a regular Python function — no internet during embedding          │
#  │  Requires: pip install sentence-transformers (already done ✅)           │
#  └─────────────────────────────────────────────────────────────────────────┘
#
# ─────────────────────────────────────────────────────────────────────────────
#  EXACTLY WHAT HAPPENS — Step by Step
# ─────────────────────────────────────────────────────────────────────────────
#
#  FIRST TIME (one time only):
#
#  embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#       │
#       │  sentence-transformers library checks local cache:
#       │  C:\Users\saiku\.cache\huggingface\hub\   ← Windows cache folder
#       │
#       │  Cache lo model unda?
#       │      YES → load from cache instantly (no internet)
#       │      NO  → download from HuggingFace Hub (one time, public, FREE)
#       │
#       ▼  Download happens (only first time):
#  https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
#  → config.json          (model architecture)      ~  3 KB
#  → tokenizer.json       (text tokenization rules) ~  466 KB
#  → pytorch_model.bin    (actual model weights)     ~  22 MB
#       │
#       ▼  Model loaded into Python process RAM:
#  PyTorch neural network ready in memory
#  No API key, no internet, no server — just a Python object
#
#  EVERY SUBSEQUENT CALL (embed_documents / embed_query):
#
#  embeddings.embed_query("What is the current company?")
#       │
#       │  ZERO internet traffic — pure local computation:
#       │
#       ▼
#  1. Tokenizer: "What is the current company?"
#                → [101, 2054, 2003, 1996, 2783, 2194, 1029, 102]
#                  (text → token IDs — model's vocabulary numbers)
#
#  ▼
#  2. PyTorch model forward pass (in your RAM, on your CPU/GPU):
#     token_ids → transformer layers (6 layers in MiniLM) → 384 numbers
#
#  ▼
#  3. Output: [0.45, -0.12, 0.78, 0.23, -0.56, ...]  (384 numbers)
#     Returned instantly — milliseconds
#
# ─────────────────────────────────────────────────────────────────────────────
#  WHY PUBLIC MODELS DON'T NEED API KEY
# ─────────────────────────────────────────────────────────────────────────────
#
#  HuggingFace Hub lo models 2 types:
#
#  Public models (90%+):
#  → Anyone download cheyyachu — no account, no key needed
#  → "all-MiniLM-L6-v2" = public ✅
#  → Like downloading a free app — no login required
#  → License: Apache 2.0 / MIT — commercial use also ok
#
#  Private / Gated models:
#  → Meta's Llama 3 (gated — need to accept license on HF website)
#  → Some enterprise models
#  → HF_TOKEN needed to download
#  → After accepting license → token generate cheyyi → .env lo add cheyyi
#
#  all-MiniLM-L6-v2 = 100% public, open-source, no restrictions ✅
#  Download = like git clone — just copying files, no auth needed
#
# ─────────────────────────────────────────────────────────────────────────────
#  PROOF — No Network Call During Embedding
# ─────────────────────────────────────────────────────────────────────────────
#
#  After first download, internet OFF chessinappudu kuda works:
#
#  # Test this yourself:
#  from langchain_huggingface import HuggingFaceEmbeddings
#  emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#  # disconnect internet here ← try it!
#  vec = emb.embed_query("test sentence")
#  print(len(vec))  # → 384  ✅ still works offline!
#
#  Compare with OpenAI:
#  from langchain_openai import OpenAIEmbeddings
#  emb = OpenAIEmbeddings()
#  # disconnect internet here
#  vec = emb.embed_query("test")  # → ConnectionError ❌ needs internet always
#
# ─────────────────────────────────────────────────────────────────────────────
#  WHERE IS THE MODEL CACHED?
# ─────────────────────────────────────────────────────────────────────────────
#
#  Windows:  C:\Users\saiku\.cache\huggingface\hub\
#  Linux:    ~/.cache/huggingface/hub/
#  Mac:      ~/Library/Caches/huggingface/hub/
#
#  Folder structure:
#  .cache/huggingface/hub/
#  └── models--sentence-transformers--all-MiniLM-L6-v2/
#      ├── blobs/          ← actual model files (weights, config)
#      ├── refs/           ← version pointers
#      └── snapshots/      ← model snapshot folder
#          └── main/
#              ├── config.json
#              ├── tokenizer.json
#              └── model.safetensors   ← 22MB model weights
#
#  Delete this folder → next run re-downloads ← thats all
#  HF_TOKEN warning message lo "Warning: unauthenticated" = fine, public model ki ok
#
# =============================================================================
# HUGGINGFACE vs OLLAMA — Deep Difference
# =============================================================================
#
# Rendu local ga run avutay, rendu free — but inside how they work chala different.
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  HuggingFace Embeddings — Python library ga directly run               │
# ├─────────────────────────────────────────────────────────────────────────┤
# │                                                                          │
# │  Architecture:                                                           │
# │  Your Python code                                                        │
# │       │                                                                  │
# │       │  import chestundi                                                │
# │       ▼                                                                  │
# │  sentence-transformers library (Python process lo embedded)             │
# │       │                                                                  │
# │       │  model weights load chestundi (RAM lo)                          │
# │       ▼                                                                  │
# │  PyTorch / ONNX Runtime (locally)                                       │
# │       │                                                                  │
# │       ▼                                                                  │
# │  [0.12, -0.45, 0.87, ...] — vector return                              │
# │                                                                          │
# │  Key points:                                                             │
# │  → No separate server, no process, no port                              │
# │  → Python process lo directly run avutundi                              │
# │  → Model first time: HuggingFace Hub nundi download (~22MB)             │
# │  → After download: ~/.cache/huggingface/ lo store avutundi              │
# │  → Next run: cache nundi load — no download                             │
# │  → pip install sentence-transformers chesthe ready                      │
# │  → Works completely offline after first download                        │
# │                                                                          │
# │  Analogy:                                                                │
# │  Microsoft Word laaga — install chesthe directly run avutundi.          │
# │  Background lo server run avvadam avasaram ledu.                        │
# └─────────────────────────────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  Ollama Embeddings — Local server tho HTTP call                         │
# ├─────────────────────────────────────────────────────────────────────────┤
# │                                                                          │
# │  ⚠️  COMMON CONFUSION: Ollama oka LLM model kaadu!                      │
# │                                                                          │
# │  Ollama = Tool / Runtime / Platform — models ni locally run cheyyadaniki │
# │  LLM Model = Llama3, Mistral, Gemma, Phi, Qwen etc. (actual AI brains)  │
# │                                                                          │
# │  Analogy:                                                                │
# │  → VLC Player (Ollama) — video player software                          │
# │  → .mp4 video file (Llama3, Mistral) — actual content                   │
# │  VLC lekapothe video play cheyyatam kastam.                              │
# │  Kani VLC itself video kaadu — idi just a player.                       │
# │                                                                          │
# │  Same way:                                                               │
# │  → Ollama = local model runner (the player)                             │
# │  → Llama3 / Mistral / Gemma = actual LLM models (the video)            │
# │  Ollama lekapothe these models locally run cheyyatam kastam.            │
# │  Kani Ollama itself AI brain kaadu.                                     │
# │                                                                          │
# │  What Ollama actually does:                                              │
# │  → Models download + manage chestundi (ollama pull llama3)             │
# │  → Model run cheyyadaniki optimized runtime provide chestundi           │
# │  → CPU/GPU efficient ga use cheyyataniki llama.cpp use chestundi        │
# │  → REST API expose chestundi (localhost:11434) — Python/any code call   │
# │  → Multiple models manage cheyyachu (list, run, remove)                │
# │                                                                          │
# │  Models Ollama run cheyyagaladadu (examples):                           │
# │  → llama3, llama3.2     (Meta's Llama models)                          │
# │  → mistral              (Mistral AI model)                              │
# │  → gemma2               (Google's Gemma model)                         │
# │  → phi3                 (Microsoft's Phi model)                        │
# │  → qwen2                (Alibaba's Qwen model)                         │
# │  → nomic-embed-text     (embedding model for vectors)                  │
# │                                                                          │
# │  Architecture:                                                           │
# │  Your Python code                                                        │
# │       │                                                                  │
# │       │  HTTP request (localhost:11434)                                  │
# │       ▼                                                                  │
# │  Ollama Server (background process — always running)                    │
# │       │                                                                  │
# │       │  model load chestundi (Ollama manages)                          │
# │       ▼                                                                  │
# │  llama.cpp / Metal / CUDA (GPU/CPU optimized)                           │
# │       │                                                                  │
# │       ▼                                                                  │
# │  [0.34, -0.21, 0.65, ...] — JSON response → Python                     │
# │                                                                          │
# │  Key points:                                                             │
# │  → Separate background application run avvali (like a mini web server)  │
# │  → Port 11434 lo listen chestundi                                       │
# │  → Python code HTTP request pampi, JSON response teesukuntundi          │
# │  → Models separately pull cheyyali: ollama pull nomic-embed-text        │
# │  → Ollama app install cheyyali (ollama.com nundi download)              │
# │  → Both LLMs and embeddings serve cheyyagaladu (versatile)             │
# │  → GPU acceleration better support chestundi                            │
# │                                                                          │
# │  Analogy (revised):                                                      │
# │  Zoom laaga — Zoom app run avvali (background lo), tarvata              │
# │  browser lo meeting join cheyyachu. Server lekapothe call avvadu.       │
# └─────────────────────────────────────────────────────────────────────────┘
#
# =============================================================================
# SIDE-BY-SIDE COMPARISON
# =============================================================================
#
#  Feature              │ HuggingFace              │ Ollama
#  ─────────────────────┼──────────────────────────┼─────────────────────────
#  How it runs          │ Python process lo direct  │ Separate background server
#  Setup                │ pip install               │ App install + model pull
#  Server needed?       │ ❌ No                     │ ✅ Yes (localhost:11434)
#  Internet needed?     │ First download only       │ First model pull only
#  After setup          │ Works offline ✅           │ Works offline ✅
#  GPU support          │ ⚠️  Limited (via PyTorch)  │ ✅ Native GPU (CUDA/Metal)
#  LLM support          │ ❌ Embeddings only here    │ ✅ Both LLMs + embeddings
#  Model management     │ HuggingFace Hub (~cache)  │ ollama pull/list/rm
#  Speed                │ Fast (no HTTP overhead)   │ Slightly slower (HTTP)
#  Models available     │ 100,000+ on HuggingFace   │ ~100 curated models
#  Python code          │ Direct object call        │ HTTP to localhost
#  Debugging            │ Python traceback          │ Check Ollama logs/server
#  ─────────────────────┴──────────────────────────┴─────────────────────────
#
#  Simple rule:
#  → Learning + quick setup                    → use HuggingFace ✅
#  → Need LLM + embedding together locally     → use Ollama ✅
#  → Production + best quality                 → use OpenAI ✅
#
# =============================================================================
# HOW TO SWITCH BETWEEN THEM (just 2 lines change)
# =============================================================================
#
#  # OpenAI ki switch cheyyadam:
#  # from langchain_openai import OpenAIEmbeddings
#  # embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
#
#  # Ollama ki switch cheyyadam:
#  # from langchain_ollama import OllamaEmbeddings
#  # embeddings = OllamaEmbeddings(model="nomic-embed-text")
#
#  # ask_from_docs() function unchanged — embeddings object swap chesthe enough ✅
#  # This is the power of LangChain — provider swap chessinappudu rest same avutundi
#
# =============================================================================

# Embedding model create chestunnam. Idi text meaning ni vector form lo pettestundi.
# ─────────────────────────────────────────────────────────────────────────────
# EMBEDDING PROVIDER CHOICE — uncomment one block, comment the other
# ─────────────────────────────────────────────────────────────────────────────

# OPTION A — HuggingFace (local, free, no API key)  ← CURRENTLY ACTIVE
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
    # model_name — HuggingFace Hub lo unna sentence transformer model
    # "all-MiniLM-L6-v2" — small (22MB), fast, good quality embeddings
    # This model text ni 384 numbers ki compress chestundi (384-dim vector)
    # First time: model download avutundi locally cache cheyyadam
    # Next time: cache nundi load — faster
)
# embeddings object ready — embeddings.embed_query("text") → [0.12, -0.45, ...] (384 numbers)

# OPTION B — Ollama (local, offline, 768-dim)  ← READY TO USE
# Ollama installed ✅  |  nomic-embed-text pulled ✅ (274MB)  |  langchain-ollama ✅
# To switch: comment OPTION A above, uncomment 2 lines below
# from langchain_ollama import OllamaEmbeddings
# embeddings = OllamaEmbeddings(model="nomic-embed-text")
# (768-dim vectors, works offline, no API key, Ollama server must be running)


def ask_from_docs(docs, question):
    # ask_from_docs() — complete RAG pipeline oka function lo
    # docs     : List[Document] — any loader nundi loaded documents
    # question : str            — user ask chesina question
    # returns  : str            — LLM generated answer (context-grounded)

    # ── Step 1: Split documents into chunks ──────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        # chunk_size=1000 → prathi chunk max 1000 characters
        # Why 1000? LLM context window ki fit avvali + meaningful content contain cheyyali
        # Too small (100) → context cut avutundi
        # Too large (5000) → LLM ki irrelevant content vastundi
        chunk_overlap=200,
        # chunk_overlap=200 → consecutive chunks lo 200 chars shared
        # Why overlap? Sentence/idea chunk boundary lo cut ainappatiki
        # Overlap = context continuity — next chunk also has ending of previous chunk
    )
    # splitter object ready — documents pass chesthe List[Document] chunks return chesthundi

    # ── Step 2: Actual splitting ──────────────────────────────────────────────
    chunks = splitter.split_documents(docs)
    # split_documents() — List[Document] → List[Document] (smaller chunks)
    # split_text() would take plain string; split_documents() takes Document objects
    # Each chunk inherits metadata from parent document (source, page number etc.)
    # Example: 12-page PDF → ~50-80 chunks (depends on text density)

    # ── Step 3: Embed and store in vector database ────────────────────────────
    #
    # HuggingFace ↔ Chroma connection — exactly here is the handshake:
    #
    # Chroma.from_documents() chessinappudu internally ila jarugtundi:
    #
    #  chunks (List[Document]) — split chessin text pieces
    #       │
    #       │  Chroma internally calls:
    #       │  embeddings.embed_documents([c.page_content for c in chunks])
    #       │
    #       ▼
    #  HuggingFaceEmbeddings.embed_documents()
    #       │
    #       │  each chunk text → all-MiniLM-L6-v2 model (Python process, local)
    #       │
    #       ▼
    #  List of vectors: [[0.12,-0.45,...], [0.34,-0.21,...], [0.87,0.11,...], ...]
    #       │            chunk1 vector      chunk2 vector     chunk3 vector
    #       │
    #       │  Chroma receives these vectors + original text + metadata
    #       │
    #       ▼
    #  Chroma stores 3 things together per chunk:
    #  ┌──────────────────────────────────────────────────────────┐
    #  │  chunk1_id  │  "April 2024 HeartCentrix..."  │  [0.12,-0.45,...]  │
    #  │  chunk2_id  │  "Java Python Selenium..."     │  [0.34,-0.21,...]  │
    #  │  chunk3_id  │  "Test Automation, BDD..."     │  [0.87, 0.11,...]  │
    #  └──────────────────────────────────────────────────────────┘
    #   (id)           (original text — for returning to user)  (vector — for search)
    #
    # Key point: HuggingFace produces the numbers, Chroma stores+searches them.
    # They are separate tools connected via the `embedding=embeddings` parameter.
    #
    # ── VECTOR STORE CHOICE — uncomment one, comment the other ──────────────
    #
    # OPTION A — Chroma (in-memory)  ← CURRENTLY ACTIVE
    # Best for: learning, small-medium data (<500K chunks), quick setup
    vectorstore = Chroma.from_documents(
        documents=chunks,
        # documents — chunks list (List[Document]) ni vectorstore lo store cheyyali
        embedding=embeddings,
        # embedding= ← THIS LINE is the connection between HuggingFace and Chroma
        # embeddings object (HuggingFaceEmbeddings) ikkada Chroma ki pass chesam
        # Chroma idi use chesi internally embed_documents() call chestundi
        # "Use this embedding model to convert my text chunks to vectors"
        # Provider change chessinappudu (Ollama/OpenAI) — only this line changes ✅
    )
    # vectorstore — in-memory Chroma DB ready, all chunks embedded + stored

    # OPTION B — FAISS (Facebook AI Similarity Search)  ← READY TO USE
    # Best for: large data (millions of vectors), faster search, memory-mapped
    # "FAISS is a library for efficient similarity search and clustering of
    #  dense vectors. It contains algorithms that search in sets of vectors of
    #  any size, up to ones that possibly do not fit in RAM." — Meta AI
    #
    # Install: pip install faiss-cpu  (or faiss-gpu for NVIDIA GPU)
    #
    # In-memory (same as Chroma usage above):
    # from langchain_community.vectorstores import FAISS
    # vectorstore = FAISS.from_documents(documents=chunks, embedding=embeddings)
    #
    # Persistent (save index to disk, reload without re-embedding next run):
    # from langchain_community.vectorstores import FAISS
    # vectorstore = FAISS.from_documents(documents=chunks, embedding=embeddings)
    # vectorstore.save_local("./faiss_index")   ← run once, creates index files
    #
    # Reload saved index (skip embedding — instant load):
    # vectorstore = FAISS.load_local(
    #     "./faiss_index", embeddings,
    #     allow_dangerous_deserialization=True
    # )
    #
    # After either option — retriever + rest of pipeline unchanged ✅

    # ── Step 4: Create retriever ──────────────────────────────────────────────
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 3},
        # search_kwargs — retriever ki pass cheyye extra options
        # "k": 3 → question ki top 3 most similar chunks return cheyyi
        # k=3 → 3 chunks × ~1000 chars = ~3000 chars context LLM ki pampistam
        # k ekkuva chesthe more context but more tokens (cost + latency)
    )
    # retriever = vectorstore nundi search cheyyadaniki wrapper object
    # retriever.invoke("question") chessinappudu:
    #   1. embeddings.embed_query(question) → question vector generate
    #   2. Chroma lo stored chunk vectors tho cosine similarity
    #   3. Top k chunks return

    # ── Step 5: Retrieve relevant chunks ─────────────────────────────────────
    relevant_docs = retriever.invoke(question)
    #
    # HuggingFace ↔ Chroma second handshake — here at retrieval time:
    #
    #  question: "What is the current company?"
    #       │
    #       │  retriever internally calls:
    #       │  embeddings.embed_query(question)
    #       │
    #       ▼
    #  HuggingFaceEmbeddings.embed_query()
    #       │
    #       │  question text → same all-MiniLM-L6-v2 model
    #       │  IMPORTANT: same model used for chunks AND question
    #       │  (different model use chesthe vectors incompatible — wrong results)
    #       │
    #       ▼
    #  question_vector: [0.45, -0.12, 0.78, ...]  (384 numbers)
    #       │
    #       │  Chroma: compare question_vector with all stored chunk vectors
    #       │  cosine_similarity(question_vector, chunk1_vector) = 0.97 ✅
    #       │  cosine_similarity(question_vector, chunk2_vector) = 0.43 ✗
    #       │  cosine_similarity(question_vector, chunk3_vector) = 0.81 ✅
    #       │
    #       ▼
    #  Top k=3 chunks (original text, not vectors) return chestundi
    #  relevant_docs = [Document("April 2024 HeartCentrix..."), ...]

    # ── Step 6: Build context string ─────────────────────────────────────────
    context = "\n\n".join(
        doc.page_content for doc in relevant_docs
        # Generator expression — relevant_docs lo prathi doc ki page_content teesukuntundi
        # doc.page_content — Document object lo actual text content
    )
    # "\n\n".join() — 3 chunks ni 2 blank lines tho separate chesi oka string ga combine
    # Why? LLM ki oka continuous context string pass cheyyali — separate strings kaadu
    # context = "chunk1 text\n\nchunk2 text\n\nchunk3 text"

    # ── Step 7: Build prompt ──────────────────────────────────────────────────
    prompt = ChatPromptTemplate.from_template("""
Answer the question using only the given context.

Context:
{context}

Question:
{question}

If the answer is not available in the context, say:
"I don't know based on the provided document."
""")
    # from_template() — single string tho prompt create cheyyadam
    # {context}  — runtime lo actual context string fill avutundi
    # {question} — runtime lo actual user question fill avutundi
    # "only the given context" — LLM ni hallucinate cheyyakunda restrict chestundi
    # Last line — context lo answer lekapothe honest ga "I don't know" cheppali

    # ── Step 8: Build chain ───────────────────────────────────────────────────
    chain = prompt | llm | StrOutputParser()
    # | (pipe operator) — LCEL (LangChain Expression Language) chain
    # prompt → format chestundi (variables fill cheyyadam)
    # llm    → formatted prompt Groq ki pampi answer teesukuntundi
    # StrOutputParser() → LLM response object nundi plain text extract chestundi
    # Left to right: input → prompt format → LLM call → string output

    # ── Step 9: Invoke chain ──────────────────────────────────────────────────
    answer = chain.invoke({
        "context": context,
        # "context" key — prompt lo {context} placeholder ikkada fill avutundi
        "question": question,
        # "question" key — prompt lo {question} placeholder ikkada fill avutundi
    })
    # chain.invoke() — entire pipeline oka sarige run chestundi
    # context + question → prompt format → LLM → string answer
    # answer — plain string: "The current company is HeartCentrix Solutions..."

    # ── Step 10: Return answer ────────────────────────────────────────────────
    return answer
    # Caller ki final answer string return chestundi
    # pdfLoader.py, webLoader.py, textLoader.py anni idi use chestay


# ============================================================
# SUPPORTED DATA LOADERS — ask_from_docs() ki any loader feed cheyyachu
# ============================================================
# ask_from_docs(docs, question) — docs list accept chesthundi.
# Aa docs eppati loader nundi vachinappatiki — same function work chesthundi.
# Below lo popular loaders anni chupistunnam with examples.
# ============================================================

# ------------------------------------------------------------
# 1) PDF Loader — PDF files nundi content load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import PyPDFLoader
#
# loader = PyPDFLoader("path/to/document.pdf")
# docs = loader.load()
# # Returns: one Document per page
# # docs[0].page_content = page text
# # docs[0].metadata     = {source, page, total_pages}
#
# answer = ask_from_docs(docs, "What is the summary of chapter 1?")

# ------------------------------------------------------------
# 2) Web Loader — Website URL nundi content load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import WebBaseLoader
# import bs4
#
# # Basic — full page
# loader = WebBaseLoader("https://example.com/article")
#
# # Filtered — specific CSS classes only (cleaner content)
# loader = WebBaseLoader(
#     web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
#     bs_kwargs=dict(
#         parse_only=bs4.SoupStrainer(
#             class_=("post-title", "post-content", "post-header")
#         )
#     )
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What are autonomous agents?")

# ------------------------------------------------------------
# 3) Text Loader — Plain .txt files load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import TextLoader
#
# loader = TextLoader("path/to/notes.txt", encoding="utf-8")
# docs = loader.load()
# # Returns: single Document with full file content
# # docs[0].page_content = entire file text
# # docs[0].metadata     = {source: filepath}
#
# answer = ask_from_docs(docs, "What did Gandhi talk about?")

# ------------------------------------------------------------
# 4) CSV Loader — CSV files load cheyyadam (each row = Document)
# ------------------------------------------------------------
# from langchain_community.document_loaders.csv_loader import CSVLoader
#
# loader = CSVLoader("path/to/data.csv")
# docs = loader.load()
# # Returns: one Document per CSV row
# # docs[0].page_content = "column1: value\ncolumn2: value\n..."
# # docs[0].metadata     = {source, row}
#
# # Example: Employee CSV tho questions ask cheyyadam
# loader = CSVLoader(
#     "employees.csv",
#     csv_args={"delimiter": ","},
#     source_column="employee_id"   # metadata source ga use cheyyalsina column
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "Who is the highest paid employee?")

# ------------------------------------------------------------
# 5) JSON Loader — JSON files load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import JSONLoader
#
# # jq_schema — JSON lo eppati field extract cheyyali
# loader = JSONLoader(
#     file_path="data.json",
#     jq_schema=".[]",           # array of objects
#     text_content=False
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What is the status of order #1042?")

# ------------------------------------------------------------
# 6) Weather API — API response nundi Document create cheyyadam
# ------------------------------------------------------------
# Real-time data ki — API call → JSON response → manually Document create cheyyadam
#
# import requests
# from langchain_core.documents import Document
#
# # OpenWeatherMap API call
# API_KEY = "your_openweather_api_key"
# city = "Hyderabad"
# url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
# response = requests.get(url).json()
#
# # API response ni Document ga manually convert cheyyadam
# weather_text = f"""
# City: {response['name']}
# Temperature: {response['main']['temp']}°C
# Feels like: {response['main']['feels_like']}°C
# Humidity: {response['main']['humidity']}%
# Condition: {response['weather'][0]['description']}
# Wind speed: {response['wind']['speed']} m/s
# """
# docs = [Document(page_content=weather_text, metadata={"source": "openweathermap", "city": city})]
# answer = ask_from_docs(docs, "What is the current temperature and humidity in Hyderabad?")

# ------------------------------------------------------------
# 7) YouTube Loader — YouTube video transcript load cheyyadam
# ------------------------------------------------------------
# pip install youtube-transcript-api
# from langchain_community.document_loaders import YoutubeLoader
#
# loader = YoutubeLoader.from_youtube_url(
#     "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
#     add_video_info=True    # title, author kuda metadata lo add chestundi
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What is the main topic of this video?")

# ------------------------------------------------------------
# 8) Wikipedia Loader — Wikipedia articles load cheyyadam
# ------------------------------------------------------------
# pip install wikipedia
# from langchain_community.document_loaders import WikipediaLoader
#
# loader = WikipediaLoader(query="Large Language Models", load_max_docs=2)
# docs = loader.load()
# answer = ask_from_docs(docs, "What are large language models used for?")

# ------------------------------------------------------------
# 9) Directory Loader — Folder lo unna anni files oka sarige load
# ------------------------------------------------------------
# from langchain_community.document_loaders import DirectoryLoader, TextLoader
#
# loader = DirectoryLoader(
#     "path/to/folder",
#     glob="**/*.txt",      # pattern — only .txt files
#     loader_cls=TextLoader
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "Summarize all documents in this folder")

# ------------------------------------------------------------
# SUMMARY TABLE
# ------------------------------------------------------------
# Loader                | Source        | One doc per     | Import from
# ----------------------|---------------|-----------------|------------------------
# PyPDFLoader           | PDF file      | Page            | langchain_community
# WebBaseLoader         | URL           | Full page/filter| langchain_community
# TextLoader            | .txt file     | Whole file      | langchain_community
# CSVLoader             | .csv file     | Row             | langchain_community
# JSONLoader            | .json file    | Object          | langchain_community
# Document (manual)     | Any API/data  | Custom          | langchain_core.documents
# YoutubeLoader         | YouTube URL   | Video           | langchain_community
# WikipediaLoader       | Wikipedia     | Article         | langchain_community
# DirectoryLoader       | Folder        | File            | langchain_community
# ------------------------------------------------------------
# Key insight: Loader emi use chessinappatiki — output always `List[Document]`
# ask_from_docs(docs, question) — same function, any source works! ✅


# =============================================================================
# FAISS similarity_search_with_score — Working Implementation
# =============================================================================
# Image lo chupinchindi: docs_and_score = db.similarity_search_with_score(query)
# Idi FAISS specific method — documents + L2 distance score rendu return chestundi
# Lower score = better match (unlike cosine similarity where higher = better)

def search_with_scores(docs, query, k=3):
    """
    FAISS similarity_search_with_score demo function.

    Chroma retriever tho compare chesthe:
      retriever.invoke()                → only documents (no score)
      db.similarity_search_with_score() → documents + L2 score ✅

    Args:
        docs  : List[Document] — any loader nundi loaded documents
        query : str            — search question
        k     : int            — how many results return (default 3)

    Returns:
        List of (Document, float) tuples — (chunk text, L2 distance score)
    """
    from langchain_community.vectorstores import FAISS
    # FAISS import — langchain_community.vectorstores nundi
    # Install: pip install faiss-cpu  (if not installed)

    # Step 1: Split documents into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        # chunk_size — same as ask_from_docs() — 1000 chars per chunk
        chunk_overlap=200
        # chunk_overlap — 200 chars overlap between consecutive chunks
    )
    chunks = splitter.split_documents(docs)
    # chunks — List[Document] of smaller text pieces

    # Step 2: Build FAISS vectorstore
    db = FAISS.from_documents(
        documents=chunks,
        # documents — embedded + indexed ayye chunks
        embedding=embeddings
        # embeddings — HuggingFace/Ollama/OpenAI — same global embeddings object
    )
    # db — FAISS in-memory index ready
    # Variable name "db" — image lo exact ga use chesindi (db.similarity_search_with_score)

    # Step 3: similarity_search_with_score — FAISS specific method
    docs_and_score = db.similarity_search_with_score(query, k=k)
    # similarity_search_with_score(query, k=k) — image lo exact same call
    # query — search question string
    # k     — how many results return (passed from function argument)
    # Returns: List[(Document, float)] — (chunk, L2_distance_score)

    # Step 4: Print results with scores
    print(f"\n{'='*60}")
    print(f"Query: {query}")
    print(f"Total results: {len(docs_and_score)}")
    print(f"{'='*60}")

    for i, (doc, score) in enumerate(docs_and_score):
        # doc   — LangChain Document object (page_content + metadata)
        # score — L2 distance (float) — LOWER = BETTER MATCH
        print(f"\nResult {i+1}:")
        print(f"  L2 Score : {score:.4f}  {'[Close match]' if score < 1.5 else '[Distant match]'}")
        # L2 distance threshold: < 1.5 = good match for 384-dim HuggingFace vectors
        # Note: L2 range depends on embedding dimensions — 384-dim typically 0.5 to 2.5
        # 0.0 - 0.5 = nearly identical  |  0.5 - 1.5 = relevant  |  1.5+ = less relevant
        print(f"  Content  : {doc.page_content[:200]}...")
        # [:200] — first 200 chars preview (full content can be long)
        print(f"  Metadata : {doc.metadata}")
        # metadata — source file, page number etc.

    return docs_and_score
    # Caller ki full (doc, score) list return chestundi — further processing cheyyachu


# =============================================================================
# HOW TO USE search_with_scores() — Example
# =============================================================================
#
#  from langchain_community.document_loaders import PyPDFLoader
#  from helper import search_with_scores
#
#  # Load PDF
#  loader = PyPDFLoader(r"C:\learnAi\LangChain\SaiKumar.Kambam.Resume.pdf")
#  docs = loader.load()
#
#  # Search with scores
#  query = "What is the current company?"
#  results = search_with_scores(docs, query, k=3)
#
#  # Output:
#  # ============================================================
#  # Query: What is the current company?
#  # Total results: 3
#  # ============================================================
#  #
#  # Result 1:
#  #   L2 Score : 0.1823  ✅ Close match
#  #   Content  : April 2024 - Present | Test Automation Engineer | HeartCentrix...
#  #   Metadata : {'source': 'resume.pdf', 'page': 2}
#  #
#  # Result 2:
#  #   L2 Score : 0.3412  ✅ Close match
#  #   Content  : Responsibilities: Developed and maintained automated tests...
#  #   Metadata : {'source': 'resume.pdf', 'page': 3}
#  #
#  # Result 3:
#  #   L2 Score : 0.7823  ⚠️  Distant match
#  #   Content  : Skills: Java, Python, Selenium, Cucumber...
#  #   Metadata : {'source': 'resume.pdf', 'page': 1}
#
# ask_from_docs()  → full RAG pipeline → LLM answer generate
# search_with_scores() → FAISS specific → raw scores + chunks (no LLM call)
# Use search_with_scores() to debug / inspect what chunks are being retrieved
