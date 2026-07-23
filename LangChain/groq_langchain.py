"""
Minimal LangChain + Groq example.

Loads the GROQ_API_KEY from the .env file and sends a prompt to a
Groq-hosted model via LangChain's ChatGroq integration.
"""

import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Load environment variables from the .env file in this folder
load_dotenv()

# Read the API key (raises a clear error if it's missing)
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to the .env file in this folder."
    )

# Create the chat model. Swap the model name for any model Groq supports,
# e.g. "llama-3.1-8b-instant" for a faster/cheaper option.
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=api_key,
)


def main() -> None:
    messages = [
        SystemMessage(content="You are a concise, helpful assistant."),
        HumanMessage(content="In one sentence, what is LangChain?"),
    ]

    response = llm.invoke(messages)
    print(response.content)


if __name__ == "__main__":
    main()
