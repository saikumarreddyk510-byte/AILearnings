# ---------------- Architecture Diagram ----------------
# [docs + question input]
#          |
#          v
# [split documents into chunks]
#          |
#          v
# [create embeddings for chunks]
#          |
#          v
# [store vectors in Chroma]
#          |
#          v
# [retrieve top-k relevant chunks]
#          |
#          v
# [build context string]
#          |
#          v
# [prompt + ChatAnthropic (Claude) + parser]
#          |
#          v
# [final answer text return]
#
# ---------------- Difference from helper.py ----------------
# helper.py       → Groq LLM (ChatGroq)      → cloud, fast inference
# claude_helper.py → Claude LLM (ChatAnthropic) → Anthropic, more powerful reasoning
#
# Everything same — only LLM line different.
# Same embeddings (HuggingFace), same vectorstore (Chroma),
# same chunking (RecursiveCharacterTextSplitter), same retriever logic.

from pathlib import Path

# `.env` file nundi secret keys load cheyyadaniki.
from dotenv import load_dotenv

# Claude LLM ni call cheyyadaniki class — Anthropic's LangChain integration.
from langchain_anthropic import ChatAnthropic

# Long docs ni chunks ga split cheyyadaniki.
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Text ni embedding vectors ga convert cheyyadaniki.
from langchain_huggingface import HuggingFaceEmbeddings

# Vector database (store + retrieve similar chunks).
from langchain_chroma import Chroma

# Prompt template build cheyyadaniki.
from langchain_core.prompts import ChatPromptTemplate

# Final output ni clean string ga parse cheyyadaniki.
from langchain_core.output_parsers import StrOutputParser

# First try local .env, then fallback to workspace LangChain/.env.
local_env = Path(__file__).with_name(".env")
fallback_env = Path(__file__).resolve().parents[2] / "LangChain" / ".env"
if local_env.exists():
    load_dotenv(dotenv_path=local_env)
elif fallback_env.exists():
    load_dotenv(dotenv_path=fallback_env)
else:
    load_dotenv()

import os

# Claude LLM create chestunnam.
# model — claude-3-5-haiku-20241022: fast + affordable Claude model
# temperature=0 — consistent, factual answers (RAG use case ki ideal)
# api_key — .env lo CLAUDE_API_KEY ga store chesam; ChatAnthropic ANTHROPIC_API_KEY expect
#           chesthundi kaabatti explicitly pass chestunnam
llm = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0,
    api_key=os.getenv("CLAUDE_API_KEY"),
)

# Embedding model — same as helper.py (HuggingFace local model)
# LLM different ainappatiki embeddings same ga maintain chestunnam.
# Embeddings = text meaning ni numbers ga convert — LLM tho sambandham ledu.
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def ask_from_docs(docs, question):
    """
    Docs + question teesukoni Claude tho answer generate chestundi.

    helper.py tho comparison:
      helper.py       → ChatGroq (qwen model)
      claude_helper.py → ChatAnthropic (claude-3-5-haiku)
    Rest of the logic identical.
    """

    # Step 1: Big docs ni small chunks ga split cheyyadam.
    # chunk_size=1000  → prathi chunk max 1000 characters
    # chunk_overlap=200 → chunks overlap chestay — context cut avvakunda
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    # Step 2: Actual chunk list create.
    chunks = splitter.split_documents(docs)

    # Step 3: Chunks ni vectors ga convert chesi Chroma lo store cheyyadam.
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
    )

    # Step 4: Retriever create. k=3 ante top 3 relevant chunks teesukuntam.
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 3},
    )

    # Step 5: Question ki semantically closest chunks retrieve chestam.
    relevant_docs = retriever.invoke(question)

    # Step 6: Retrieved chunks ni single context string ga join chestam.
    context = "\n\n".join(
        doc.page_content for doc in relevant_docs
    )

    # Step 7: Claude ki clear instruction prompt.
    # "Only context use cheyyi" — hallucination avoid cheyyadaniki strict rule.
    prompt = ChatPromptTemplate.from_template("""
Answer the question using only the given context.

Context:
{context}

Question:
{question}

If the answer is not available in the context, say:
"I don't know based on the provided document."
""")

    # Step 8: Prompt → Claude → StrOutputParser chain.
    # helper.py lo: prompt | ChatGroq | StrOutputParser()
    # ikkada:       prompt | ChatAnthropic | StrOutputParser()
    chain = prompt | llm | StrOutputParser()

    # Step 9: Context + question pass chesi Claude nundi answer generate.
    answer = chain.invoke({
        "context": context,
        "question": question,
    })

    # Step 10: Caller ki answer text return.
    return answer
