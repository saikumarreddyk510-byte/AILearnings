from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0
)

response1 = llm.invoke("My name is Sai.")
print(response1.content)

response2 = llm.invoke("What is my name?")
print(response2.content)

########################### WITH Memory (chat history) ###########################
from langchain_core.messages import HumanMessage, AIMessage

chat_history = []

user_msg = "My name is Sangeeth."
chat_history.append(HumanMessage(content=user_msg))

response = llm.invoke(chat_history)
chat_history.append(AIMessage(content=response.content))

user_msg = "What is my name?"
chat_history.append(HumanMessage(content=user_msg))

response = llm.invoke(chat_history)
chat_history.append(AIMessage(content=response.content))

print(response.content)

########################### Conversation Buffer Memory ###########################
# NOTE: ConversationBufferMemory / ConversationChain are the LEGACY memory API.
# They were removed from the main `langchain` package in v1.0 and now live in
# `langchain_classic`. They still work but are deprecated.
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.chains import ConversationChain

memory = ConversationBufferMemory()

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

response1 = conversation.predict(input="My name is Sangeeth.")
print(response1)

response2 = conversation.predict(input="What is my name?")
print(response2)

print(memory.buffer)
