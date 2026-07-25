# ---------------- Architecture Diagram ----------------
# [Text file path]
#        |
#        v
# [TextLoader load docs]
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
# I file role enti ante: "document ni read chesi helper brain ki question adagadanki launcher".
#
# Super simple ga flow:
# 1) Text file nundi content load chestam.
# 2) Content ni docs list lo pettukuntam.
# 3) Oka question ready chestam.
# 4) Docs + question ni helper function ki pampistam.
# 5) Helper retrieve chesi LLM answer generate chestundi.
# 6) Final answer screen meeda print chestam.

# Local helper file nundi RAG question-answer function import chestunnam.
from helper import ask_from_docs
# LangChain TextLoader ni import chestunnam to read plain text file as Document objects.
from langchain_community.document_loaders import TextLoader

# Step 1: E text file read cheyyalo path specify chestunnam.
# `encoding='utf-8'` valla special characters safe ga read avuthayi.
loader = TextLoader(r"LangChain/sample_news.txt", encoding='utf-8')
# Step 2: File content ni LangChain Document list ga load chestunnam.
docs = loader.load()


# print("----------------------------------------------------------------------------------")
# print(docs)
# print("----------------------------------------------------------------------------------")
# print(len(docs))
# print("----------------------------------------------------------------------------------")
# print(docs[0].metadata)
# print("----------------------------------------------------------------------------------")
# print(docs[0].page_content)
# print("----------------------------------------------------------------------------------")

question = "What did Gandhi talk about?"

# Step 3: docs + question ni helper function ki pampistam.
# Helper internally chunking, embedding, retrieval, LLM reasoning chestundi.
answers = ask_from_docs(docs, question)
# Step 4: Final plain text answer print chestunnam.
print(answers)