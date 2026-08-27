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

# ============================================================
# EXAMPLE 1 — Basic WebBaseLoader (full page content)
# ============================================================
# Idi page lo EVERY content load chestundi — nav, footer, sidebar anni kalipi.
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


# ============================================================
# EXAMPLE 2 — WebBaseLoader + bs4.SoupStrainer (filtered loading)
# ============================================================
# Problem with Example 1:
#   Full page load chesthe nav bar, footer, ads, sidebar anni noise ga vastay.
#   LLM ki irrelevant content pampitam → token waste + quality drops.
#
# Solution — SoupStrainer:
#   HTML lo specific CSS classes matrame parse cheyyadam.
#   Baaki content completely skip avutundi → clean, relevant text only.
#
# Flow:
#   URL → HTTP fetch → BeautifulSoup parse
#         → SoupStrainer filter (post-title, post-content, post-header only)
#         → Document(page_content="LLM Powered Autonomous Agents...", metadata={source:url})
#         → ask_from_docs → RAG answer

import bs4  # BeautifulSoup4 — HTML parse + filter cheyyadaniki

# WebBaseLoader tho bs4.SoupStrainer use chestunnam:
#   web_paths  — load cheyyalsina URLs tuple (trailing comma mandatory — it's a tuple)
#   bs_kwargs  — BeautifulSoup ki pass chese keyword arguments
#   parse_only — SoupStrainer instance: specific CSS classes matrame keep chestundi
loader2 = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),  # URL tuple
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            # class_ — ivi unna HTML elements matrame load avutay, rest skip
            class_=("post-title", "post-content", "post-header")
        )
    )
)

# loader2.load() chessinappudu:
#   → page fetch avutundi
#   → SoupStrainer filter run avutundi — post-title, post-content, post-header only keep
#   → Document object: page_content = "LLM Powered Autonomous Agents\nDate: June 23, 2023..."
docs2 = loader2.load()
print(f"Loaded {len(docs2)} document(s)")
print(docs2[0].page_content[:300])  # preview — clean article content only

# RAG question on the filtered blog post
question2 = "What are the key components of an LLM-powered autonomous agent?"
answer2 = ask_from_docs(docs2, question2)
print(answer2)
