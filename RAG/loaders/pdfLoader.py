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
# RAG helper function ni local helper file nundi teeskuntam.
from helper import ask_from_docs

# Step 1: E PDF file read cheyyalo path ivvadam.
loader = PyPDFLoader(r"LangChain/SaiKumar.Kambam.Resume.pdf")
# Step 2: PDF ni parse chesi page-wise documents list create cheyyadam.
docs = loader.load()

# print(docs[0].metadata)
# print(docs[0].page_content[:2000])

# Step 3: User question define chestunnam.
question = "what is the current working company name in the resume? and what is the role in that company?"

# Step 4: docs + question helper ki pampinchi answer generate cheyyadam.
answer = ask_from_docs(docs, question)
# Step 5: Final answer print.
print(answer)
