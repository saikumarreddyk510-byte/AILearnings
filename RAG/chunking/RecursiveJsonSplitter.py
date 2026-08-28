# ---------------- Architecture Diagram ----------------
# [JSON data (dict / nested object)]
#        |
#        v
# [RecursiveJsonSplitter(max_chunk_size=300)]
#        |
#        v
# [Traverse JSON depth-first]
#        |
#        v
# [Try to keep nested objects whole]
#        |
#        v
# [If object > max_chunk_size → split into smaller pieces]
#        |
#        v
# [chunks: List[dict] — each chunk a smaller JSON piece]
#        |
#        v
# [Optional: split_text() → List[str] for LLM / RAG]
#
# ---------------- Deep Architecture Notes ----------------
# RecursiveJsonSplitter JSON data ni depth-first traverse chesi split chestundi.
# "Depth-first" ante: nested objects lo deep ki velli chinna pieces ga cut chestundi.
# Goal:
#   → Nested JSON objects whole ga keep cheyyadam (possible aithe)
#   → Chunk size min_chunk_size to max_chunk_size madhya maintain cheyyadam
#   → If a value is a large plain string → string split cheyyadu (whole ga keeps)
#   → Hard size cap kavali ante RecursiveCharacterTextSplitter tho compose cheyyachu
# Chunk size measurement: number of characters (string length)
# How text is split: by json value (object boundaries)

# ============================================================
# HOW TO SPLIT JSON DATA
# ============================================================
# This json splitter splits json data while allowing control over chunk sizes.
# It traverses json data depth first and builds smaller json chunks.
# It attempts to keep nested json objects whole but will split them if needed
# to keep chunks between a min_chunk_size and the max_chunk_size.
#
# If the value is not a nested json, but rather a very large string, the string
# will not be split. If you need a hard cap on the chunk size consider composing
# this with a Recursive Text splitter on those chunks. There is an optional
# pre-processing step to split lists, by first converting them to json (dict)
# and then splitting.
#
# How the text is split:  json value
# How the chunk size is measured: by number of characters
#
# Telugu lo: JSON ni depth-first ga traverse chesi chinna chinna JSON pieces ga
# split chestundi. Nested objects ni whole ga keep cheyyadam try chestundi,
# kaani size exceed aithe split chestundi.

from langchain_text_splitters import RecursiveJsonSplitter
# RecursiveJsonSplitter — JSON data ni chunk_size base ga split cheyyadaniki

import json   # json module — dict to string convert cheyyadaniki (display kosam)

# ============================================================
# STEP 1 — Sample JSON data (nested structure)
# ============================================================
# Real use case lo idi: API response, config file, database record, product catalog
json_data = {
    "langchain": {
        "description": "LangChain is a framework for building LLM applications.",
        "components": {
            "chains": {
                "description": "Chains connect multiple LangChain components together.",
                "types": ["LLMChain", "SequentialChain", "RouterChain"],
                "use_case": "Build pipelines that process input through multiple steps."
            },
            "agents": {
                "description": "Agents use LLMs to decide which tools to call dynamically.",
                "types": ["ReAct", "OpenAI Functions", "Structured Chat"],
                "use_case": "Autonomous decision-making with tool access."
            },
            "memory": {
                "description": "Memory allows LLMs to remember previous conversation turns.",
                "types": ["ConversationBufferMemory", "ConversationSummaryMemory"],
                "use_case": "Chatbots and multi-turn conversations."
            }
        },
        "use_cases": ["Chatbots", "RAG", "Code generation", "Data analysis"],
        "version": "0.3"
    },
    "rag": {
        "description": "RAG combines retrieval with generation for grounded answers.",
        "steps": ["Load", "Split", "Embed", "Store", "Retrieve", "Generate"],
        "loaders": {
            "pdf": "PyPDFLoader",
            "web": "WebBaseLoader",
            "text": "TextLoader",
            "csv": "CSVLoader"
        }
    }
}
# json_data lo nested structure:
#   langchain → components → chains / agents / memory (3 levels deep)
#   rag → loaders → pdf/web/text/csv

# ============================================================
# STEP 2 — Create RecursiveJsonSplitter
# ============================================================
splitter = RecursiveJsonSplitter(
    max_chunk_size=300   # prathi chunk maximum 300 characters ga undali
                         # Splitter nested objects ni whole ga keep chestundi —
                         # 300 exceed aithe sub-objects lo split chestundi
)
# min_chunk_size default: None (no minimum)
# max_chunk_size=300 → each chunk string representation max 300 chars

# ============================================================
# STEP 3 — Split into JSON chunks (List[dict])
# ============================================================
json_chunks = splitter.split_json(json_data=json_data)
# split_json() — input: Python dict
#                output: List[dict] — prathi item oka smaller JSON piece
# Note: split_json() dict chunks return chesthundi (not Document objects)

print("=" * 60)
print(f"Total JSON chunks: {len(json_chunks)}")
print("=" * 60)

for i, chunk in enumerate(json_chunks):
    # json.dumps() — dict ni formatted string ga convert (indentation tho readable)
    chunk_str = json.dumps(chunk, indent=2)
    print(f"\nChunk {i+1} [{len(chunk_str)} chars]:")
    print(chunk_str)

# ============================================================
# STEP 4 — split_text() → List[str] (for RAG / LLM use)
# ============================================================
# split_json() → List[dict]  (structured data)
# split_text() → List[str]   (string representations — RAG pipeline ki ready)

text_chunks = splitter.split_text(json_data=json_data)
# split_text() — same split logic, but output strings instead of dicts
# RAG lo vectorstore.add_texts() or ask_from_docs() ki pass cheyyataniki useful

print("\n" + "=" * 60)
print(f"Text chunks (for RAG): {len(text_chunks)}")
print("=" * 60)
for i, chunk in enumerate(text_chunks):
    print(f"\nText Chunk {i+1} [{len(chunk)} chars]:")
    print(chunk)

# ---- EXPECTED OUTPUT EXPLANATION ----
# JSON depth-first traverse order:
#   → langchain.components.chains (nested deep → separate chunk)
#   → langchain.components.agents (nested deep → separate chunk)
#   → langchain.components.memory (nested deep → separate chunk)
#   → langchain.use_cases + langchain.version (small → combined)
#   → rag.description + rag.steps (medium → separate chunk)
#   → rag.loaders (nested → separate chunk)
#
# KEY OBSERVATIONS:
#   1. Depth-first traversal — deeply nested objects first ga split avutay
#   2. Whole objects preferred — chains object whole ga one chunk lo untundi (if fits)
#   3. max_chunk_size=300 — 300 chars exceed chesthe split avutundi
#   4. Large strings not split — description strings chala long ainappatiki split cheyyadu
#      (hard cap kavali ante RecursiveCharacterTextSplitter tho compose cheyyali)
#   5. split_text() same data strings ga — RAG pipeline ki directly use cheyyachu

# ============================================================
# BONUS — Compose with RecursiveCharacterTextSplitter (hard cap)
# ============================================================
# Problem: RecursiveJsonSplitter large string values split cheyyadu
# Solution: First JSON split, then char-based split on large chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter

char_splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,     # absolute max — no chunk exceeds 200 chars
    chunk_overlap=20    # context overlap
)

# text_chunks ni further split cheyyadam (hard cap enforce cheyyadam)
final_chunks = []
for chunk in text_chunks:
    if len(chunk) > 200:
        # Large chunk → char-based split
        sub_chunks = char_splitter.split_text(chunk)
        final_chunks.extend(sub_chunks)    # extend — list lo anni sub_chunks add
    else:
        # Small chunk → keep as-is
        final_chunks.append(chunk)         # append — single item add

print("\n" + "=" * 60)
print(f"After hard cap split: {len(final_chunks)} chunks")
print("=" * 60)
for i, chunk in enumerate(final_chunks):
    print(f"\nFinal Chunk {i+1} [{len(chunk)} chars]: {chunk[:80]}{'...' if len(chunk) > 80 else ''}")
    # [:80] → first 80 chars print (preview kosam)
    # '...' → 80 chars kante ekkuva unte ellipsis show cheyyadam
