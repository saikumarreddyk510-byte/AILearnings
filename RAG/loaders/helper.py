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
# [prompt + ChatGroq + parser]
#          |
#          v
# [final answer text return]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file enti ante: "book nundi right pages select chesi answer cheppe helper brain".
#
# Super simple ga process:
# 1) Big document ni chinna chinna pieces ga cut chestam.
# 2) Prathi piece ni numbers (vectors) ga convert chestam.
# 3) Question ki close unna pieces ni vetukuntam.
# 4) Aa pieces matrame model ki context ga istham.
# 5) Model aa context base chesi answer istundi.

from pathlib import Path

# `.env` file nundi secret keys load cheyyadaniki.
from dotenv import load_dotenv
# Groq LLM ni call cheyyadaniki class.
from langchain_groq import ChatGroq
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

# LLM create chestunnam. temperature=0.3 ante balanced creativity.
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3,
)

# Embedding model create chestunnam. Idi text meaning ni vector form lo pettestundi.
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def ask_from_docs(docs, question):
    # Step 1: Big docs ni small chunks ga split cheyyadam for better retrieval.
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

    # Step 5: Question ki best matching documents retrieve chestam.
    relevant_docs = retriever.invoke(question)

    # Step 6: Retrieved chunks ni single context text ga join chestam.
    context = "\n\n".join(
        doc.page_content for doc in relevant_docs
    )

    # Step 7: Model ki clear instruction prompt create chestam.
    # "Context outside ki vellaku" ani strict rule istundi.
    prompt = ChatPromptTemplate.from_template("""
Answer the question using only the given context.

Context:
{context}

Question:
{question}

If the answer is not available in the context, say:
"I don't know based on the provided document."
""")

    # Step 8: Prompt -> LLM -> String output parser chain build.
    chain = prompt | llm | StrOutputParser()

    # Step 9: Context + question pass chesi final answer generate chestam.
    answer = chain.invoke({
        "context": context,
        "question": question,
    })

    # Step 10: Caller ki answer text return.
    return answer
