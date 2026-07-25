# ---------------- Architecture Diagram ----------------
# [Raw Text]
#        |
#        v
# [CharacterTextSplitter(separator="\n", chunk_size=50, chunk_overlap=10)]
#        |
#        v
# [Split text by separator "\n" (newlines)]
#        |
#        v
# [Chunks that fit within chunk_size of 50 chars]
#        |
#        v
# [Merge small chunks with overlap of 10 chars]
#        |
#        v
# [chunks list -> print each chunk with index]
#
# ---------------- Deep Architecture Notes ----------------
# CharacterTextSplitter oka fixed separator base ga text ni split chestundi.
# separator="\n" ante newline character dggara split avutundi.
# chunk_size=50 ante oka chunk lo max 50 characters untaayi.
# chunk_overlap=10 ante consecutive chunks lo 10 characters shared untaayi — context preserve avutundi.
# Idi simplest splitter — single separator use chestundi, recursive try cheyyadam ledu.
# Simple line-by-line text ki best choice.

from langchain_text_splitters import CharacterTextSplitter

text = """
Generative AI is changing the world.
LLMs are becoming powerful.
RAG helps LLMs access private data.
"""

splitter = CharacterTextSplitter(
    separator="\n",
    chunk_size=50,
    chunk_overlap=10
)

chunks = splitter.split_text(text)

for i, chunk in enumerate(chunks):
    print(f"\nChunk {i+1}")
    print(chunk)
