"""
I file lo manam local machine lo run ayye Llama model ni Ollama dvara use chestunnam.
Simple ga cheppali ante: internet lekunda kuda local AI tho chat cheyyachu.
"""

# Local Ollama chat model connect cheyyadaniki class import chestunnam.
from langchain_ollama import ChatOllama
# Chat prompt templates and history placeholders kosam imports.
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# Output ni plain text ga convert cheyyadaniki parser.
from langchain_core.output_parsers import StrOutputParser
# Conversation history store cheyyadaniki message classes.
from langchain_core.messages import HumanMessage, AIMessage

# Ee variable lo e model use cheyyalo define chestunnam.
MODEL = "llama3.2"

# Local Ollama server ki connect ayye model object create chestunnam.
# temperature=0 ante stable and consistent answers vaste chance ekkuva.
llm = ChatOllama(model=MODEL, temperature=0)

# I prompt template chat ki rules + history + current input combine chestundi.
prompt = ChatPromptTemplate.from_messages(
    [
        # System message: AI behavior ni set chestundi.
        ("system", "You are a friendly assistant. Keep answers brief and clear."),
        # Past chat turns ikkada inject avutayi.
        MessagesPlaceholder(variable_name="history"),
        # Current user question ikkada fill avutundi.
        ("human", "{input}"),
    ]
)

# LCEL pipeline: prompt -> model -> string parser.
chain = prompt | llm | StrOutputParser()


# Interactive chat loop run cheyyadaniki function.
def chat_loop() -> None:
    """User prompt adigi, response stream chesi, history remember chestundi."""
    # Startup message print chestunnam.
    print(f"Llama chat ready (model: {MODEL}). Type 'exit' or 'quit' to stop.\n")
    # Empty list tho history start chestunnam.
    history: list = []

    # Infinite loop run avutundi user exit cheppe varaku.
    while True:
        try:
            # User nundi input tisukoni extra spaces remove chestam.
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            # Ctrl+D/Ctrl+C vaste graceful ga exit.
            print("\nGoodbye!")
            break

        # User `exit` or `quit` ante loop stop.
        if user_input.lower() in {"exit", "quit"}:
            print("Goodbye!")
            break
        # Empty input vaste next iteration ki vellipotham.
        if not user_input:
            continue

        # AI response start label print chestunnam.
        print("Llama: ", end="", flush=True)
        # Stream chunks collect cheyyadaniki list.
        response_parts: list[str] = []

        # `stream` dvara token-by-token response vasthundi.
        for chunk in chain.stream({"history": history, "input": user_input}):
            # Prathi chunk immediate ga display chestam.
            print(chunk, end="", flush=True)
            # Later full response build cheyyadaniki list lo save chestam.
            response_parts.append(chunk)
        # Response ayyaka new line ivvadam readability kosam.
        print("\n")

        # User message ni history lo add chestam.
        history.append(HumanMessage(content=user_input))
        # AI full response ni join chesi history lo add chestam.
        history.append(AIMessage(content="".join(response_parts)))


# Single question ask cheyyadaniki helper function.
def single_question(question: str) -> None:
    """Chat loop lekunda oka direct question ki answer print chestundi."""
    # Empty history tho one-shot answer generate chestam.
    answer = chain.invoke({"history": [], "input": question})
    # Final answer print.
    print(answer)


# Ee block file direct ga run chesinappude execute avutundi.
if __name__ == "__main__":
    # First quick demo question.
    single_question("In one sentence, what makes Llama models useful?")
    # Output neat ga divide cheyyadaniki separator line.
    print("-" * 60)
    # Tarvata continuous interactive chat mode start.
    chat_loop()
