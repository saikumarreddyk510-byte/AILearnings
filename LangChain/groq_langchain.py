"""
Ikkada manam LangChain + Groq use chesi oka simple chat example run chestunnam.
Chinna pillaki cheppinatlu: mana message ni AI ki pampinchi, dani answer tiskuntam.
"""

# `os` module use chesi environment variables (system lo save ayina values) read chestam.
import os

# `.env` file lo unna keys ni load cheyyadaniki idi use avutundi.
from dotenv import load_dotenv
# Groq model ni LangChain dvara connect cheyyadaniki idi class.
from langchain_groq import ChatGroq
# Chat style messages create cheyyadaniki ee message classes use chestam.
from langchain_core.messages import HumanMessage, SystemMessage

# Step 1: `.env` file lo unna values ni current program loki load cheyyi.
load_dotenv()

# Step 2: GROQ_API_KEY ane key ni environment nundi teeskuntam.
api_key = os.getenv("GROQ_API_KEY")
# Step 3: Key lekapothe program confuse avvakunda clear error ivvali.
if not api_key:
    # RuntimeError ante: run chestunnappudu immediate ga stop cheyyi ani signal.
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to the .env file in this folder."
    )

# Step 4: Groq chat model object create chestunnam.
# `model` ante e AI brain variant use cheyyalo.
# `temperature=0` ante output predictable ga, less random ga untundi.
# `api_key` dvara authentication jarugutundi.
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=api_key,
)


# `main` function lo mana core workflow untundi.
def main() -> None:
    # Chat messages list create chestunnam.
    # System message: AI ki rules ivvadam.
    # Human message: user question ivvadam.
    messages = [
        SystemMessage(content="You are a concise, helpful assistant."),
        HumanMessage(content="In one sentence, what is LangChain?"),
    ]

    # Model ni call chesi messages ki response teeskuntam.
    response = llm.invoke(messages)
    # Response object lo actual text `content` lo untundi, dani print chestam.
    print(response.content)


# Ee condition valla file direct ga run chesinappude `main()` execute avutundi.
if __name__ == "__main__":
    # Main flow start.
    main()
