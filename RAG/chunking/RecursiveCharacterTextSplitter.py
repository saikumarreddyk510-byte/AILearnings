# ---------------- Architecture Diagram ----------------
# [Raw Text]
#        |
#        v
# [RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)]
#        |
#        v
# [Try split by: "\n\n" -> "\n" -> " " -> ""]
#        |
#        v
# [Chunks that fit within chunk_size]
#        |
#        v
# [Merge small chunks with overlap of 20 chars]
#        |
#        v
# [chunks list -> print each chunk with index]
#
# ---------------- Deep Architecture Notes ----------------
# RecursiveCharacterTextSplitter text ni recursively split chestundi.
# Munchuga paragraphs ("\n\n"), tarvata lines ("\n"), tarvata words (" "), last ga characters ("") try chestundi.
# chunk_size=100 ante oka chunk lo max 100 characters untaayi.
# chunk_overlap=20 ante consecutive chunks lo 20 characters shared untaayi — context loss avoid avutundi.
# Idi most commonly used splitter — structure preserve chestundi and simple text ki best choice.

from langchain_text_splitters import RecursiveCharacterTextSplitter
# RecursiveCharacterTextSplitter:
#   Long text ni chinna chinna pieces (chunks) ga split cheyyadaniki use avutundi.
#   "Recursive" ante — oka separator work avvakapothe next try chestundi, order:
#     1st try: "\n\n"  (paragraph breaks)
#     2nd try: "\n"    (line breaks)
#     3rd try: " "     (word spaces)
#     4th try: ""      (individual characters — last resort)
#   Idi most natural split chestundi — sentences/paragraphs middle lo cut avvadu.

# ============================================================
# EXAMPLE 1 — Hardcoded string (quick demo)
# ============================================================
# Sample text — 4 separate paragraphs ("\n\n" tho separated)
# RAG pipeline lo idi actual document content avutundi (PDF/web/text nundi loaded)
text = """
Generative AI is changing the world.

LLMs are becoming powerful.

RAG helps LLMs access private data.

Vector databases store embeddings.
"""
# text lo 4 topics unnay — prathi paragraph oka idea represent chestundi.
# Splitter ee structure ni respect chesi split cheyyali.

splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,    # oka chunk lo maximum 100 characters undali
                       # 100 kante ekkuva characters unna chunk ni inka split chestundi
    chunk_overlap=20   # consecutive chunks lo 20 characters common ga untay
                       # Example: chunk1 last 20 chars = chunk2 first 20 chars
                       # Why? — Context cut avvakunda, meaning preserve cheyyataniki
)
# splitter object ready — ippudu text pass chesthe chunks return chesthundi

chunks = splitter.split_text(text)
# split_text() — plain string input istam, List[str] return chesthundi
# split_documents() — Document objects input istam, List[Document] return chesthundi
# RAG helper lo split_documents() use chesam; ikkada plain text ni split_text() tho demo

# chunks list lo prathi item oka chunk (text piece)
for i, chunk in enumerate(chunks):
    # Why for loop?
    #   chunks = List of strings — prathi string oka chunk (text piece)
    #   We need to see EACH chunk separately — for loop prathi item ni oka sarige process chestundi
    #   Without loop: only last chunk kanipistundi or anni chunks oka line lo compressed ga untay
    #   With loop: prathi chunk separately, clearly print avutundi — debug cheyyadam easy
    #
    # enumerate() ante enti?
    #   Normal loop: for chunk in chunks → only chunk value vastundi, index teliyadu
    #   enumerate(): for i, chunk in enumerate(chunks) → index (i) + value (chunk) rendu oka sarige
    #   i = 0, 1, 2, 3...  (0-based counter)
    #   chunk = actual text content of that chunk
    #
    # i starts from 0, so i+1 chestam for human-readable "Chunk 1, Chunk 2..."
    print(f"\nChunk {i+1}")   # \n → blank line before each chunk (readability kosam)
    print(chunk)              # actual chunk text print

# ---- EXAMPLE 1 OUTPUT ----
# Chunk 1
# Generative AI is changing the world.
#
# LLMs are becoming powerful.
#
# Chunk 2
# RAG helps LLMs access private data.
#
# Vector databases store embeddings.
#
# Output Explanation:
#   4 paragraphs → 2 chunks only
#   Why 2 and not 4?
#     chunk_size=100 → each chunk can hold up to 100 characters
#     "Generative AI..." (38 chars) + "LLMs are becoming..." (28 chars) = 66 chars → fits in one chunk ✅
#     "RAG helps..." (36 chars) + "Vector databases..." (32 chars) = 68 chars → fits in one chunk ✅
#     Splitter merges small paragraphs together until chunk_size is reached
#   chunk_overlap=20 → short text kaabatti overlap visible kaadu here


# ============================================================
# EXAMPLE 2 — Read from a real .txt file (practical usage)
# ============================================================
# Hardcoded string convenient kaadu real projects lo.
# Actual use case lo: .txt file nundi content read chesi split chestam.
#
# open("speech.txt") — file open chestundi
# "r"               — read mode ("w" = write, "a" = append, "r" = read)
# as f              — file object ni `f` variable ga refer cheyyadam
# f.read()          — entire file content oka string ga return chesthundi
# with block        — file automatically close avutundi block exit ayyaka (safe)

speech = ""                        # empty string tho start — file content ikkada store avutundi
with open("speech.txt") as f:      # speech.txt open chestunnam — same folder lo undi
    speech = f.read()              # full file content ni speech variable lo store chestunnam

# speech variable lo ippudu speech.txt full content undi
# print(speech)  — uncomment chesi full text chudachu

# Same splitter reuse — chunk_size=100, chunk_overlap=20
speech_chunks = splitter.split_text(speech)
# speech.txt lo long paragraphs unnay — each sentence 90-100+ chars
# So splitter sentences middle lo split chestundi, overlap tho context bridge chesthundi

print("\n" + "="*50)
print(f"Speech split into {len(speech_chunks)} chunks")   # total chunk count print
print("="*50)

for i, chunk in enumerate(speech_chunks):
    print(f"\nChunk {i+1}:")         # chunk number
    print(chunk)                     # chunk content
    print(f"[{len(chunk)} chars]")   # chunk size — chunk_size=100 exceed cheyyaledu ani verify cheyyachu

# ---- EXAMPLE 2 OUTPUT ----
# ==================================================
# Speech split into 19 chunks
# ==================================================
#
# Chunk 1:
# India is not a piece of land.
# [29 chars]
#   → Short sentence, single chunk — 29 chars, well under 100
#
# Chunk 2:
# India is a living entity — a civilization that has survived thousands of years of history,
# [92 chars]
#   → Long sentence, 92 chars — fits just under chunk_size=100
#   → Splitter "\n\n" try chesindi — paragraph split avvaledu (sentence 100+ chars)
#   → So " " (word space) separator use chesi 92 chars point lo cut chesindi
#
# Chunk 3:
# years of history, invasions, and transformations.
# [49 chars]
#   → chunk_overlap=20 in action!
#   → Chunk 2 ends with "...years of history,"
#   → Chunk 3 starts with "years of history," — SAME 20 chars repeated ✅
#   → Why? Context preserve cheyyataniki — "history" context lost avvakunda
#
# Chunk 4:
# Our freedom was not given to us. It was earned through the sacrifice of countless men and women who
# [99 chars]
#   → 99 chars — barely fits! Splitter word boundary respect chestundi
#
# Chunk 5:
# men and women who chose truth over convenience and courage over comfort.
# [72 chars]
#   → Overlap! Chunk 4 ends "...men and women who" → Chunk 5 starts "men and women who" ✅
#   → 20 char overlap clearly visible here
#
# ... (chunks 6-19 same pattern — long sentence split + 20 char overlap)
#
# Chunk 19:
# Let us move forward — not with pride alone, but with purpose.
# [63 chars]
#   → Last chunk — final sentence of the speech
#
# KEY OBSERVATIONS from output:
#   1. chunk_size=100  → No chunk exceeds 100 chars (verified by [N chars] output)
#   2. chunk_overlap=20 → Last ~20 chars of chunk N = first ~20 chars of chunk N+1
#                         Visible: Chunk2 ends "history," → Chunk3 starts "years of history,"
#                                  Chunk4 ends "men and women who" → Chunk5 starts "men and women who"
#   3. Word boundary respected → Never cuts in middle of a word
#   4. 19 chunks from ~1200 char speech → avg ~63 chars per chunk