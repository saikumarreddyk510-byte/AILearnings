"""
LangChain + Ollama (Llama) example.

Runs a Llama model fully locally via Ollama -- no API key or internet
required. Demonstrates three common LangChain patterns:

1. A prompt template (ChatPromptTemplate)
2. A simple chain using the LangChain Expression Language (LCEL) pipe `|`
3. Streaming tokens and an interactive chat loop with memory

Prerequisites:
    - Ollama installed and running
    - The model pulled locally:  ollama pull llama3.2

Run it:
    ..\\venv\\python.exe llama_langchain.py
"""

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

# The local Ollama model to use. Pull it first with: ollama pull llama3.2
# Swap for any model you've pulled, e.g. "llama3.1:8b" or "qwen2.5".
MODEL = "llama3.2"

# Connects to the local Ollama server (default http://localhost:11434).
llm = ChatOllama(model=MODEL, temperature=0)

# A reusable prompt template. {history} is filled with past turns and
# {input} with the latest user message.
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a friendly assistant. Keep answers brief and clear."),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ]
)

# Build a chain: prompt -> model -> plain-text output (LCEL pipe syntax).
chain = prompt | llm | StrOutputParser()


def chat_loop() -> None:
    """Interactive REPL that streams responses and remembers the conversation."""
    print(f"Llama chat ready (model: {MODEL}). Type 'exit' or 'quit' to stop.\n")
    history: list = []

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if user_input.lower() in {"exit", "quit"}:
            print("Goodbye!")
            break
        if not user_input:
            continue

        print("Llama: ", end="", flush=True)
        response_parts: list[str] = []

        # Stream the answer token-by-token for a responsive feel.
        for chunk in chain.stream({"history": history, "input": user_input}):
            print(chunk, end="", flush=True)
            response_parts.append(chunk)
        print("\n")

        # Save this turn so the model has context next time.
        history.append(HumanMessage(content=user_input))
        history.append(AIMessage(content="".join(response_parts)))


def single_question(question: str) -> None:
    """Ask one question without the interactive loop."""
    answer = chain.invoke({"history": [], "input": question})
    print(answer)


if __name__ == "__main__":
    # Quick non-interactive demo, then start the chat loop.
    single_question("In one sentence, what makes Llama models useful?")
    print("-" * 60)
    chat_loop()
