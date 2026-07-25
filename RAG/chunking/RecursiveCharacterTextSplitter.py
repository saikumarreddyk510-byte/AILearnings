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

text = """
Generative AI is changing the world.

LLMs are becoming powerful.

RAG helps LLMs access private data.

Vector databases store embeddings.
"""

splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=20
)

chunks = splitter.split_text(text)

for i, chunk in enumerate(chunks):
    print(f"\nChunk {i+1}")
    print(chunk)