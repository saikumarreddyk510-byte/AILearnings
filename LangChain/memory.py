# ---------------- Architecture Diagram ----------------
# [User Text]
#    |
#    +--> [No History: llm.invoke("...")]
#    |         |
#    |         v
#    |    [Model may forget previous turn]
#    |
#    +--> [Manual chat_history list]
#    |         |
#    |         v
#    |    [HumanMessage/AIMessage append]
#    |         |
#    |         v
#    |    [llm.invoke(chat_history)]
#    |
#    +--> [ConversationChain + BufferMemory (legacy)]
#              |
#              v
#         [Auto memory + replies + buffer print]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file main goal: memory undi vs memory ledu difference chupinchadam.
#
# Part A: Memory Leni Calls
# Step 1: First prompt `My name is Sai.` pampistam.
# Step 2: Separate second call lo `What is my name?` adugutam.
# Step 3: Previous context pass cheyyakapothe model confuse avvachu.
#
# Part B: Manual History List
# Step 1: `chat_history = []` create chestam.
# Step 2: User message HumanMessage ga add chestam.
# Step 3: Model reply AIMessage ga add chestam.
# Step 4: Next user question kuda add chestam.
# Step 5: Full history model ki pampiste context maintain avtundi.
#
# Part C: ConversationBufferMemory (legacy)
# Step 1: Memory object create chestam.
# Step 2: ConversationChain lo llm + memory attach chestam.
# Step 3: `predict()` calls automatic ga memory update chestayi.
# Step 4: `memory.buffer` print chesi full chat transcript choodachu.
#
# Data Types:
# - chat_history: list[HumanMessage | AIMessage]
# - memory.buffer: str
# - model output: str
#
# Concept summary:
# Context pampithe AI gurthupettundi, context pampakapothe AI marchipovachu.

# `.env` file values ni load cheyyadaniki import.
from dotenv import load_dotenv
# Groq model connect cheyyadaniki import.
from langchain_groq import ChatGroq

# Step 1: Environment variables load cheyyi.
load_dotenv()

# Step 2: Model object create chestunnam.
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0
)

# Memory lekunda first message pampistunnam.
response1 = llm.invoke("My name is Sai.")
# First response content print.
print(response1.content)

# Inko separate call lo memory pass cheyyaledu kabatti model gurthupettadu.
response2 = llm.invoke("What is my name?")
# Second response print.
print(response2.content)

# ---------------- WITH Memory (chat history list) ----------------
# Human/AI messages format lo history maintain cheyyadaniki imports.
from langchain_core.messages import HumanMessage, AIMessage

# Empty history list start.
chat_history = []

# User first message set chestunnam.
user_msg = "My name is Sangeeth."
# User message ni history lo HumanMessage ga add chestunnam.
chat_history.append(HumanMessage(content=user_msg))

# History motham model ki pampistunnam.
response = llm.invoke(chat_history)
# Model answer ni history lo AIMessage ga add chestunnam.
chat_history.append(AIMessage(content=response.content))

# Next user question set chestunnam.
user_msg = "What is my name?"
# Second user message kuda history lo add chestunnam.
chat_history.append(HumanMessage(content=user_msg))

# Malli full history tho model ni invoke chestunnam.
response = llm.invoke(chat_history)
# Latest AI response ni history lo append chestunnam.
chat_history.append(AIMessage(content=response.content))

# Final response print chestunnam.
print(response.content)

# ---------------- Conversation Buffer Memory (legacy API) ----------------
# Legacy memory classes ippudu `langchain_classic` package lo untayi.
from langchain_classic.memory import ConversationBufferMemory
# Legacy conversation chain import.
from langchain_classic.chains import ConversationChain

# Buffer memory object create.
memory = ConversationBufferMemory()

# LLM + memory combine chesi conversation chain build chestunnam.
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# First input predict chestam; chain memory lo save chestundi.
response1 = conversation.predict(input="My name is Sangeeth.")
# First chain response print.
print(response1)

# Second input adigi memory test chestunnam.
response2 = conversation.predict(input="What is my name?")
# Second chain response print.
print(response2)

# Memory buffer lo full conversation text print chestunnam.
print(memory.buffer)
