# ---------------- Architecture Diagram ----------------
# [Text File Path]
#        |
#        v
# [TextLoader -> docs]
#        |
#        v
# [HuggingFaceEmbeddings]
#        |
#        v
# [SemanticChunker(embeddings)]
#        |
#        v
# [split_documents(docs)]
#        |
#        v
# [chunks list]
#        |
#        v
# [print(chunks)]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file lo mana goal: plain text ni smart ga chunks ga break cheyyadam.
# Normal split lo fixed size untundi, kani semantic split lo meaning base chesi break chestundi.
# Anduke related sentences okate chunk lo undadaniki chance ekkuva.

# Semantic chunking class import chestunnam.
from langchain_experimental.text_splitter import SemanticChunker
# Embeddings generate cheyyadaniki model wrapper import.
from langchain_huggingface import HuggingFaceEmbeddings
# Text file ni LangChain docs format lo load cheyyadaniki import.
from langchain_community.document_loaders import TextLoader

# Step 1: Source text file ni load cheyyadaniki loader create chestunnam.
loader = TextLoader(r"LangChain/sample_news.txt", encoding="utf-8")
# Step 2: File content ni document list ga convert chestunnam.
docs = loader.load()

# Step 3: Embedding model initialize chestunnam.
# Idi sentence meaning ni vector format lo convert chestundi.
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Step 4: Semantic chunker create chestunnam using embeddings.
splitter = SemanticChunker(
    embeddings
)

# Step 5: Documents ni semantic boundaries base chesi chunks ga split chestunnam.
chunks = splitter.split_documents(docs)
# Step 6: Final chunks ni print chestunnam.
print(chunks)
