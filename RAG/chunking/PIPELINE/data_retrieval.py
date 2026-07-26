from langchain_ollama import OllamaEmbeddings

embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)

vector = embeddings.embed_query("What is RAG?")

print(type(vector))
print(len(vector))
print(vector[:10])
