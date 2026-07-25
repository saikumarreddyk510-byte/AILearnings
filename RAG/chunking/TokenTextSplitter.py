# ---------------- Architecture Diagram ----------------
# [Raw Text]
#        |
#        v
# [TokenTextSplitter(chunk_size=20, chunk_overlap=5)]
#        |
#        v
# [Tokenizer (tiktoken / cl100k_base)]
#        |
#        v
# [Token IDs split into chunks of 20 with 5 overlap]
#        |
#        v
# [Decode token chunks back to text strings]
#        |
#        v
# [chunks list -> print each chunk]
#
# ---------------- Deep Architecture Notes ----------------
# TokenTextSplitter words/characters base ga kaadu, tokens base ga split chestundi.
# LLMs (like GPT) tokens lo think chestaayi, so idi realistic chunking strategy.
# tiktoken library use chesi text ni token IDs ga convert chestundi.
# chunk_size=20 ante oka chunk lo max 20 tokens untaayi.
# chunk_overlap=5 ante consecutive chunks lo 5 tokens shared untaayi — context preserve avutundi.
# Idi character/word splitters kante LLM-aware chunking ki more accurate.

from langchain_text_splitters import TokenTextSplitter

text = """
Generative AI is changing the world.

LLMs are becoming powerful.

RAG helps LLMs access private data.

Vector databases store embeddings.
"""

splitter = TokenTextSplitter(
    chunk_size=20,
    chunk_overlap=5
)

chunks = splitter.split_text(text)

for chunk in chunks:
    print(chunk)