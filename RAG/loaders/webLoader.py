# ---------------- Architecture Diagram ----------------
# [Website URL]
#        |
#        v
# [WebBaseLoader fetch docs]
#        |
#        v
# [docs list]
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
# I file role enti ante: "website nundi information tecchi, helper brain tho answer cheppinche launcher".
#
# Super simple flow:
# 1) Oka URL istam.
# 2) Aa page content ni documents ga load chestam.
# 3) Oka question adugutam.
# 4) Docs + question helper ki pampistam.
# 5) Helper retrieve + LLM use chesi answer istundi.
# 6) Final answer ni terminal lo print chestam.

# Website content ni LangChain Document list ga load cheyyadaniki import.
from langchain_community.document_loaders import WebBaseLoader
# RAG helper function ni local helper file nundi import chestunnam.
from helper import ask_from_docs

# Step 1: E website page nundi content teeskovalo URL pass chestunnam.
loader = WebBaseLoader("https://docs.langchain.com/oss/python/integrations/document_loaders")
# Step 2: Page content ni docs list ga load chestunnam.
docs = loader.load()

# print(docs[0].metadata)
# print(docs[0].page_content[:2000])

# Step 3: User question define chestunnam.
question = "Total how many types of document loaders are there?"

# Step 4: docs + question helper function ki pampinchi answer generate chestunnam.
answer = ask_from_docs(docs, question)
# Step 5: Final answer print.
print(answer)
