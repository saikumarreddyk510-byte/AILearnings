# ---------------- Architecture Diagram ----------------
# [PDF file path]
#        |
#        v
# [PyPDFLoader load docs]
#        |
#        v
# [docs list (per-page documents)]
#        |
#        v
# [question string]
#        |
#        v
# [ask_from_docs(docs, question)]
#        |
#        v
# [RAG answer text]
#        |
#        v
# [print(answer)]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file role enti ante: "PDF ni chadivi, helper brain ki question adige controller file".
#
# Simple ga flow ila untundi:
# 1) Resume PDF file ni read chestam.
# 2) PDF content ni docs list ga convert chestam.
# 3) Oka question set chestam.
# 4) docs + question ni ask_from_docs ki pampistam.
# 5) Helper RAG use chesi best answer return chestundi.
# 6) Final answer terminal lo print chestam.

# PDF file ni LangChain Document objects ga load cheyyadaniki importer.
from langchain_community.document_loaders import PyPDFLoader
# Groq helper
from helper import ask_from_docs as ask_groq
# Claude helper
from claude_helper import ask_from_docs as ask_claude

# Step 1: E PDF file read cheyyalo path ivvadam.
loader = PyPDFLoader(r"C:\learnAi\LangChain\SaiKumar.Kambam.Resume.pdf")
# Step 2: PDF ni parse chesi page-wise documents list create cheyyadam.
docs = loader.load()
print(f"Loaded {len(docs)} pages from PDF")

# Step 3: User question define chestunnam.
question = "what is the current working company name in the resume? and what is the role in that company?"

# ── Groq answer ──────────────────────────────────────────
print("\n--- Groq (qwen3.6-27b) ---")
groq_answer = ask_groq(docs, question)
print(groq_answer.encode("ascii", errors="replace").decode())

# ── Claude answer ─────────────────────────────────────────
print("\n--- Claude (claude-3-5-haiku) ---")
claude_answer = ask_claude(docs, question)
print(claude_answer)
