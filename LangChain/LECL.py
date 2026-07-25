# ---------------- Architecture Diagram ----------------
# [Topic Input]
#    |
#    +--> [PromptTemplate] -> [ChatGroq] -> [StrOutputParser] -> [Single Output]
#    |
#    +--> [RunnableParallel]
#    |         |
#    |         +--> [Summary Chain]
#    |         +--> [Examples Chain]
#    |         +--> [Quiz Chain]
#    |                 |
#    |                 v
#    |            [3 Outputs Printed]
#    |
#    +--> [RunnablePassthrough + Summary Chain]
#              |
#              v
#         [Original Topic + Summary Printed]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file lo 3 patterns chupistunnam: Simple Chain, Parallel Chain, Passthrough Chain.
#
# Part A: Simple Chain
# Step 1: Topic variable prompt lo fill avutundi.
# Step 2: Prompt model ki velthundi.
# Step 3: Model output parser dvara plain text ga marutundi.
# Step 4: Final result print chestam.
#
# Part B: RunnableParallel
# Step 1: Oke topic nundi 3 tasks create chestam (summary, examples, quiz).
# Step 2: 3 chains parallel ga run avuthayi.
# Step 3: Output dictionary lo 3 keys tho result vastundi.
# Step 4: Prathi key output separate ga print chestam.
#
# Part C: RunnablePassthrough
# Step 1: Input topic ni untouched ga oka key lo preserve chestam.
# Step 2: Ade input tho summary generate chestam.
# Step 3: Output lo original input + transformed summary rendu pondutam.
#
# Data Shapes:
# - Input: dict or str
# - Chain output: str
# - Parallel output: dict[str, str]
#
# Enduku ee file important ante:
# - LCEL pipeline ela compose cheyyalo chupistundi.
# - Oke input nundi multi-output generation pattern nerpisthundi.

# `.env` file nundi secrets/loadable variables ni read cheyyadaniki idi import.
from dotenv import load_dotenv
# Groq model ni LangChain dvara call cheyyadaniki class import.
from langchain_groq import ChatGroq
# Prompt template create cheyyadaniki import.
from langchain_core.prompts import PromptTemplate
# Model response ni plain string ga parse cheyyadaniki parser import.
from langchain_core.output_parsers import StrOutputParser
# Multiple chains ni okesari run cheyyadaniki RunnableParallel import.
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# Step 1: `.env` file lo unna values program ki load cheyyi.
load_dotenv()

# Step 2: AI model object create chestunnam.
# `temperature=0.3` ante konchem creative responses ravachu.
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3
)

# Step 3: `topic` ane variable accept chese prompt template create chestunnam.
prompt = PromptTemplate.from_template(
    "Create a short blog intro about {topic} in simple Telugu."
)

# Step 4: Output ni clean string ga marchadaniki parser create chestunnam.
parser = StrOutputParser()

# Step 5: LCEL pipe (`|`) use chesi prompt -> model -> parser chain build chestunnam.
chain = prompt | llm | parser

# Step 6: Topic value ichhi chain run chestunnam.
result = chain.invoke({
    "topic": "Generative AI"
})

# Step 7: Generated output print chestunnam.
print(result)

# ---------------- Runnable Parallel ----------------
# Idi enti ante: oka input tho multiple outputs okesari generate cheyyadam.

# Summary kosam prompt.
summary_prompt = PromptTemplate.from_template(
    "Summarize {topic} in 3 simple lines."
)

# Examples kosam prompt.
examples_prompt = PromptTemplate.from_template(
    "Give 3 real-world examples of {topic}."
)

# Quiz questions kosam prompt.
quiz_prompt = PromptTemplate.from_template(
    "Create 3 quiz questions about {topic}."
)

# Prathi prompt ki separate mini-chain create chestunnam.
summary_chain = summary_prompt | llm | parser
examples_chain = examples_prompt | llm | parser
quiz_chain = quiz_prompt | llm | parser

# Ikkada 3 chains ni parallel ga oka dictionary lo map chestunnam.
parallel_chain = RunnableParallel({
    "summary": summary_chain,
    "examples": examples_chain,
    "quiz": quiz_chain
})

# Oka input topic tho 3 outputs okesari generate cheyyi.
result = parallel_chain.invoke({
    "topic": "Generative AI"
})

# Dictionary lo result keys ni print chestunnam.
print(result["summary"])
print(result["examples"])
print(result["quiz"])

# ---------------- Runnable Passthrough ----------------
# Passthrough ante original input ni unchanged ga result lo carry cheyyadam.

# 20 words summary generate cheyyadaniki prompt.
summary_prompt = PromptTemplate.from_template(
    "Write a 20 words summary about {topic}."
)

# Prompt + model + parser chain create.
summary_chain = summary_prompt | llm | parser

# Oka output lo original topic + generated summary rendu ivvadam.
chain = RunnableParallel({
    "topic": RunnablePassthrough(),
    "summary": summary_chain
})

# Direct string input istunnam; adhi topic ga pass avutundi.
result = chain.invoke("LangChain")

# Original input and model output rendu display chestunnam.
print("Original Topic:", result["topic"])
print("Generated Summary:", result["summary"])
