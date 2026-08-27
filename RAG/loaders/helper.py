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
    model="qwen/qwen3.6-27b",
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


# ============================================================
# SUPPORTED DATA LOADERS — ask_from_docs() ki any loader feed cheyyachu
# ============================================================
# ask_from_docs(docs, question) — docs list accept chesthundi.
# Aa docs eppati loader nundi vachinappatiki — same function work chesthundi.
# Below lo popular loaders anni chupistunnam with examples.
# ============================================================

# ------------------------------------------------------------
# 1) PDF Loader — PDF files nundi content load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import PyPDFLoader
#
# loader = PyPDFLoader("path/to/document.pdf")
# docs = loader.load()
# # Returns: one Document per page
# # docs[0].page_content = page text
# # docs[0].metadata     = {source, page, total_pages}
#
# answer = ask_from_docs(docs, "What is the summary of chapter 1?")

# ------------------------------------------------------------
# 2) Web Loader — Website URL nundi content load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import WebBaseLoader
# import bs4
#
# # Basic — full page
# loader = WebBaseLoader("https://example.com/article")
#
# # Filtered — specific CSS classes only (cleaner content)
# loader = WebBaseLoader(
#     web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
#     bs_kwargs=dict(
#         parse_only=bs4.SoupStrainer(
#             class_=("post-title", "post-content", "post-header")
#         )
#     )
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What are autonomous agents?")

# ------------------------------------------------------------
# 3) Text Loader — Plain .txt files load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import TextLoader
#
# loader = TextLoader("path/to/notes.txt", encoding="utf-8")
# docs = loader.load()
# # Returns: single Document with full file content
# # docs[0].page_content = entire file text
# # docs[0].metadata     = {source: filepath}
#
# answer = ask_from_docs(docs, "What did Gandhi talk about?")

# ------------------------------------------------------------
# 4) CSV Loader — CSV files load cheyyadam (each row = Document)
# ------------------------------------------------------------
# from langchain_community.document_loaders.csv_loader import CSVLoader
#
# loader = CSVLoader("path/to/data.csv")
# docs = loader.load()
# # Returns: one Document per CSV row
# # docs[0].page_content = "column1: value\ncolumn2: value\n..."
# # docs[0].metadata     = {source, row}
#
# # Example: Employee CSV tho questions ask cheyyadam
# loader = CSVLoader(
#     "employees.csv",
#     csv_args={"delimiter": ","},
#     source_column="employee_id"   # metadata source ga use cheyyalsina column
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "Who is the highest paid employee?")

# ------------------------------------------------------------
# 5) JSON Loader — JSON files load cheyyadam
# ------------------------------------------------------------
# from langchain_community.document_loaders import JSONLoader
#
# # jq_schema — JSON lo eppati field extract cheyyali
# loader = JSONLoader(
#     file_path="data.json",
#     jq_schema=".[]",           # array of objects
#     text_content=False
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What is the status of order #1042?")

# ------------------------------------------------------------
# 6) Weather API — API response nundi Document create cheyyadam
# ------------------------------------------------------------
# Real-time data ki — API call → JSON response → manually Document create cheyyadam
#
# import requests
# from langchain_core.documents import Document
#
# # OpenWeatherMap API call
# API_KEY = "your_openweather_api_key"
# city = "Hyderabad"
# url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
# response = requests.get(url).json()
#
# # API response ni Document ga manually convert cheyyadam
# weather_text = f"""
# City: {response['name']}
# Temperature: {response['main']['temp']}°C
# Feels like: {response['main']['feels_like']}°C
# Humidity: {response['main']['humidity']}%
# Condition: {response['weather'][0]['description']}
# Wind speed: {response['wind']['speed']} m/s
# """
# docs = [Document(page_content=weather_text, metadata={"source": "openweathermap", "city": city})]
# answer = ask_from_docs(docs, "What is the current temperature and humidity in Hyderabad?")

# ------------------------------------------------------------
# 7) YouTube Loader — YouTube video transcript load cheyyadam
# ------------------------------------------------------------
# pip install youtube-transcript-api
# from langchain_community.document_loaders import YoutubeLoader
#
# loader = YoutubeLoader.from_youtube_url(
#     "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
#     add_video_info=True    # title, author kuda metadata lo add chestundi
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "What is the main topic of this video?")

# ------------------------------------------------------------
# 8) Wikipedia Loader — Wikipedia articles load cheyyadam
# ------------------------------------------------------------
# pip install wikipedia
# from langchain_community.document_loaders import WikipediaLoader
#
# loader = WikipediaLoader(query="Large Language Models", load_max_docs=2)
# docs = loader.load()
# answer = ask_from_docs(docs, "What are large language models used for?")

# ------------------------------------------------------------
# 9) Directory Loader — Folder lo unna anni files oka sarige load
# ------------------------------------------------------------
# from langchain_community.document_loaders import DirectoryLoader, TextLoader
#
# loader = DirectoryLoader(
#     "path/to/folder",
#     glob="**/*.txt",      # pattern — only .txt files
#     loader_cls=TextLoader
# )
# docs = loader.load()
# answer = ask_from_docs(docs, "Summarize all documents in this folder")

# ------------------------------------------------------------
# SUMMARY TABLE
# ------------------------------------------------------------
# Loader                | Source        | One doc per     | Import from
# ----------------------|---------------|-----------------|------------------------
# PyPDFLoader           | PDF file      | Page            | langchain_community
# WebBaseLoader         | URL           | Full page/filter| langchain_community
# TextLoader            | .txt file     | Whole file      | langchain_community
# CSVLoader             | .csv file     | Row             | langchain_community
# JSONLoader            | .json file    | Object          | langchain_community
# Document (manual)     | Any API/data  | Custom          | langchain_core.documents
# YoutubeLoader         | YouTube URL   | Video           | langchain_community
# WikipediaLoader       | Wikipedia     | Article         | langchain_community
# DirectoryLoader       | Folder        | File            | langchain_community
# ------------------------------------------------------------
# Key insight: Loader emi use chessinappatiki — output always `List[Document]`
# ask_from_docs(docs, question) — same function, any source works! ✅
