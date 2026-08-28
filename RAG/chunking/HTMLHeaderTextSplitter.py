# ---------------- Architecture Diagram ----------------
# [HTML string / HTML file]
#        |
#        v
# [HTMLHeaderTextSplitter(headers_to_split_on=[("h1","H1"),("h2","H2"),("h3","H3")])]
#        |
#        v
# [Parse HTML — detect <h1>, <h2>, <h3> tags]
#        |
#        v
# [Split at each header boundary]
#        |
#        v
# [Each chunk = content + metadata {H1:"...", H2:"...", H3:"..."}]
#        |
#        v
# [Optional: pipe into RecursiveCharacterTextSplitter for size-based split]
#        |
#        v
# [Final chunks list — structure-aware, metadata-rich]
#
# ---------------- Deep Architecture Notes ----------------
# HTMLHeaderTextSplitter enti chestundi:
#   HTML document ni header tags (<h1>, <h2>, <h3>...) base ga split chestundi.
#   Prathi chunk ki metadata lo context track chestundi — which section lo undi ani.
#   Two objectives:
#     (a) Related text grouped ga untundi — semantically close content same chunk lo
#     (b) Context-rich information preserved — "idi H2 'LangChain' lo H3 'Memory' section"
#   Other text splitters tho pipeline lo kuda use cheyyachu (size-based split tarvata).
#
# CharacterTextSplitter / RecursiveCharacterTextSplitter tho comparison:
#   Those → size-based split (100 chars, 500 chars)
#   HTMLHeaderTextSplitter → structure-based split (HTML headers)
#   Real use: HTML docs → HTMLHeaderTextSplitter first → then size-based split

from langchain_text_splitters import HTMLHeaderTextSplitter
# HTMLHeaderTextSplitter — HTML content ni header structure base ga split cheyyadaniki

# ============================================================
# WHAT IS HTMLHeaderTextSplitter?
# ============================================================
# HTMLHeaderTextSplitter is a "structure-aware" chunker that splits text at the
# HTML element level and adds metadata for each header "relevant" to any given chunk.
# It can return chunks element by element or combine elements with the same metadata,
# with the objectives of:
#   (a) keeping related text grouped (more or less) semantically
#   (b) preserving context-rich information encoded in document structures.
# It can be used with other text splitters as part of a chunking pipeline.
#
# Telugu lo: HTML document lo headings (h1, h2, h3...) ni boundaries ga use chesi
# text ni split chestundi. Prathi chunk ki "ee content eppati section lo undi" ani
# metadata attach avutundi — LLM ki context clear ga avutundi.

# ============================================================
# STEP 1 — Define which HTML headers to split on
# ============================================================
headers_to_split_on = [
    # (HTML tag, metadata key name)
    # HTML lo <h1> tag kanipiste → chunk ki metadata["Header 1"] = heading text
    ("h1", "Header 1"),
    # HTML lo <h2> tag kanipiste → chunk ki metadata["Header 2"] = heading text
    ("h2", "Header 2"),
    # HTML lo <h3> tag kanipiste → chunk ki metadata["Header 3"] = heading text
    ("h3", "Header 3"),
]
# List of tuples — (html_tag, metadata_key)
# html_tag = HTML lo which tag ni split boundary ga treat cheyyali
# metadata_key = aa header text ni metadata lo which key lo save cheyyali

# ============================================================
# STEP 2 — Sample HTML string
# ============================================================
# Real use case lo idi: website nundi fetched HTML, PDF converted HTML, or docs HTML
html_string = """
<!DOCTYPE html>
<html>
<body>
    <h1>LangChain</h1>
    <p>LangChain is a framework for building LLM applications.</p>

    <h2>Components</h2>
    <p>LangChain has many components like chains, agents, and memory.</p>

    <h3>Chains</h3>
    <p>Chains connect multiple components together using the pipe operator.</p>
    <p>LCEL makes it easy to compose chains with | operator.</p>

    <h3>Agents</h3>
    <p>Agents use LLMs to decide which tools to call and when.</p>

    <h2>Use Cases</h2>
    <p>LangChain is used for chatbots, RAG systems, and automation.</p>

    <h3>RAG</h3>
    <p>RAG helps LLMs answer questions from private documents.</p>
    <p>Vector databases store embeddings for fast retrieval.</p>
</body>
</html>
"""
# html_string lo structure:
#   h1: LangChain
#     h2: Components
#       h3: Chains
#       h3: Agents
#     h2: Use Cases
#       h3: RAG

# ============================================================
# STEP 3 — Create splitter and split
# ============================================================
html_splitter = HTMLHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on
    # headers_to_split_on — which tags ni boundaries ga use cheyyalo define chesam
)
# html_splitter object ready — HTML parse chesi header-based chunks return chesthundi

html_header_splits = html_splitter.split_text(html_string)
# split_text() — HTML string pass chestam
# Return: List[Document] — prathi Document lo page_content + metadata untundi
# metadata lo: which h1, h2, h3 under undi aa chunk ani clearly telustundi

# ============================================================
# STEP 4 — Print chunks with metadata
# ============================================================
print("=" * 60)
print(f"Total chunks: {len(html_header_splits)}")
print("=" * 60)

for i, doc in enumerate(html_header_splits):
    # doc — LangChain Document object
    # doc.page_content — actual text content of the chunk
    # doc.metadata    — {Header 1: "...", Header 2: "...", Header 3: "..."}
    print(f"\nChunk {i+1}:")                 # chunk number
    print(f"  Content : {doc.page_content}") # what the chunk says
    print(f"  Metadata: {doc.metadata}")     # which section this belongs to

# ---- EXPECTED OUTPUT ----
# ============================================================
# Total chunks: 12
# ============================================================
#
# Chunk 1:  Content: LangChain          Metadata: {'Header 1': 'LangChain'}
# Chunk 2:  Content: LangChain is a framework...  Metadata: {'Header 1': 'LangChain'}
# Chunk 3:  Content: Components         Metadata: {'Header 1': 'LangChain', 'Header 2': 'Components'}
# Chunk 4:  Content: LangChain has...   Metadata: {'Header 1': 'LangChain', 'Header 2': 'Components'}
# Chunk 5:  Content: Chains             Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'Chains'}
# Chunk 6:  Content: Chains connect...  Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'Chains'}
# Chunk 7:  Content: Agents             Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'Agents'}
# Chunk 8:  Content: Agents use LLMs... Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'Agents'}
# Chunk 9:  Content: Use Cases          Metadata: {'Header 1': 'LangChain', 'Header 2': 'Use Cases'}
# Chunk 10: Content: LangChain is used..Metadata: {'Header 1': 'LangChain', 'Header 2': 'Use Cases'}
# Chunk 11: Content: RAG                Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'RAG'}
# Chunk 12: Content: RAG helps LLMs...  Metadata: {'Header 1': ..., 'Header 2': ..., 'Header 3': 'RAG'}
#
# NOTE: 12 chunks, not 6 — because header tag text itself (e.g. "LangChain", "Components")
# also becomes a separate chunk. HTMLHeaderTextSplitter header text ni kuda content ga treat chestundi.
#
# KEY OBSERVATIONS:
#   1. Structure-aware — split header boundaries base ga, not character count base ga
#   2. Metadata hierarchy — child chunk lo parent headers kuda preserved (H1 > H2 > H3) ✅
#      Example: Chunk 6 (Chains content) → {'Header 1': 'LangChain', 'Header 2': 'Components', 'Header 3': 'Chains'}
#   3. Context-rich — LLM ki "idi LangChain > Components > Chains section" clearly telustundi
#   4. Header text also chunked — "Chains", "Agents", "RAG" tag text separate chunks ga vasthay

# ============================================================
# BONUS — Pipeline: HTMLHeaderTextSplitter + RecursiveCharacterTextSplitter
# ============================================================
# Real docs lo h2/h3 sections chala large avvachu — 100s of paragraphs
# Solution: First header split, then size split on each header chunk
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Size-based splitter — header-based chunks ni inka chinna cheyyadaniki
char_splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,    # prathi final chunk max 200 chars
    chunk_overlap=30   # overlap for context continuity
)

# Header splits → further split by size
final_chunks = char_splitter.split_documents(html_header_splits)
# split_documents() — List[Document] input, List[Document] output
# Metadata automatically carries over to all sub-chunks ✅

print("\n" + "=" * 60)
print(f"After size split: {len(final_chunks)} chunks")
print("=" * 60)
for i, doc in enumerate(final_chunks):
    print(f"\nFinal Chunk {i+1} [{len(doc.page_content)} chars]:")
    print(f"  Content : {doc.page_content}")
    print(f"  Metadata: {doc.metadata}")
