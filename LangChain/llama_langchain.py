"""
I file lo manam local machine lo run ayye Llama model ni Ollama dvara use chestunnam.
Simple ga cheppali ante: internet lekunda kuda local AI tho chat cheyyachu.
"""

# ---------------- Architecture Diagram ----------------
# [User Input]
#    |
#    v
# [ChatPromptTemplate(system + history + input)]
#    |
#    v
# [ChatOllama Local LLM]
#    |
#    v
# [StrOutputParser]
#    |
#    +--> [single_question(): one-shot output]
#    |
#    +--> [chat_loop(): stream chunks]
#               |
#               v
#         [history append HumanMessage + AIMessage]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# Step 1: Program start ayyaka first imports load avutayi.
#         Imports ante mana toy-box nundi kavalsina tools bayataki teeyadam laanti di.
#
# Step 2: MODEL variable set chestam (example: "llama3.2").
#         Idi e robot-brain ni use cheyyalo cheppe name tag laanti di.
#
# Step 3: ChatOllama object create chestam.
#         I object local Ollama server tho matladutundi.
#         Meaning: internet kakunda mana laptop lo unna model ni call chestam.
#
# Step 4: Prompt template build chestam with 3 parts:
#         1) system message  -> AI behavior rules
#         2) history         -> old conversation memory
#         3) input           -> current user question
#         I 3 parts kalisi "AI ki complete context" create chestayi.
#
# Step 5: Chain build chestam: prompt | llm | parser
#         - prompt: question ni proper format lo set chestundi
#         - llm: model answer generate chestundi
#         - parser: answer ni clean text ga istundi
#
# Step 6: single_question() flow:
#         question -> chain.invoke({history: [], input: question}) -> print(answer)
#         I path lo history empty kabatti one-time Q&A chestundi.
#
# Step 7: chat_loop() flow:
#         user input adugutam in a while loop.
#         Prathi turn lo chain.stream() use chesi chunk-by-chunk response print chestam.
#         Chunk ante full answer lo chinna text piece.
#
# Step 8: Streaming end ayyaka response_parts join chestam.
#         Join ante chinna pieces anni kalipi oka full sentence/story cheyyadam.
#
# Step 9: Memory update chestam:
#         history.append(HumanMessage(...))
#         history.append(AIMessage(...))
#         Dinivalla next question ki model old context ni chusi better answer istundi.
#
# Step 10: Exit conditions:
#          user "exit"/"quit" type cheste loop break.
#          Ctrl+C/Ctrl+D vaste kuda safe ga program close avutundi.
#
# Data Shapes (Simple ga):
# - user_input type: str
# - history type: list[HumanMessage | AIMessage]
# - stream chunk type: str
# - final answer type: str
#
# Why this architecture bagundi:
# - Reusable chain: same logic single and loop modes lo use chestam.
# - Streaming UX: answer wait kakunda immediate text kanipistundi.
# - Memory continuity: follow-up questions natural ga answer avuthayi.
# - Local privacy: data cloud ki pampakunda local model tho run cheyyachu.
#
# Common confusion points:
# 1) "Model answer enduku context miss ayindi?"
#    Reason: history pass cheyyaledu or reset ayindi.
# 2) "Nothing prints after Llama:"
#    Reason: Ollama server run avvakapovachu or model pull cheyyaledu.
# 3) "Old messages ekkuva ayi slow ayindi"
#    Reason: history list chala pedda ayindi; truncate strategy avasaram.
#
# Tiny mental model:
# User -> Prompt Builder -> Local Brain -> Text Cleaner -> Screen
#                    ^
#                    |
#               Old Chat History

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
