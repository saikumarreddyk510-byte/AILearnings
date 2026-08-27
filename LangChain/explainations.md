# <span style="color:#0B7285;"><strong>Why LangChain? — Complete Explanation</strong></span>

---

## <span style="color:#364FC7;"><strong>1) Problem — LangChain Lekapothe Emi Jarugtundi?</strong></span>

Manamu oka AI application build cheyyadam try chestunnamu anukо. For example:

> User question adugutadu → AI answer ichindi → Answer ni file lo save cheyyadam → Tarvata database lo store cheyyadam

Simple ga sound avutundi kadha? Kani actually chaala steps untayi:

```
User input teesukоvadm
    ↓
LLM ki send cheyyadam (OpenAI / Groq / Ollama)
    ↓
Prompt properly format cheyyadam
    ↓
LLM response parse cheyyadam
    ↓
Response ni next step ki pass cheyyadam
    ↓
Memory maintain cheyyadam (conversation history)
    ↓
External tools call cheyyadam (search, database, files)
    ↓
Final output present cheyyadam
```

Ee anni steps ni **raw code lo manually** cheyyadam ante — chaala boilerplate code raayali, chaala errors handle cheyyali, chaala time waste avutundi.

**LangChain lekapothe manamu cheyye pani:**

```python
# Without LangChain — chaala code raayali
import openai

client = openai.OpenAI(api_key="...")

# Manually prompt build cheyyadam
messages = [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": user_input}
]

# Manually API call cheyyadam
response = client.chat.completions.create(
    model="gpt-4",
    messages=messages
)

# Manually response parse cheyyadam
answer = response.choices[0].message.content

# Manually memory maintain cheyyadam
conversation_history.append({"role": "user", "content": user_input})
conversation_history.append({"role": "assistant", "content": answer})

# Ee code inka grow avutundi tools, chains add chesthe...
```

Idi oka simple case ki. Real application lo tools, memory, multiple LLMs, output parsers anni add chesthe code **nightmare** avutundi.

---

## <span style="color:#5F3DC4;"><strong>2) LangChain Ante Enti? — The Solution</strong></span>

**LangChain** oka **framework** — LLM-based applications build cheyyadaniki ready-made building blocks provide chesthundi.

Simple analogy:

> Inti ni build cheyyadaniki manamu every brick manually make cheyyadam ledu. Already made bricks (LangChain) teesukuni arrange chestamu.

```
Without LangChain:  Clay → Brick → Wall → Room → House  (anni steps manually)
With LangChain:     Ready Bricks → Arrange → House ready  (fast, clean)
```

LangChain chesthundi:
- ✅ LLM calls ni **standardize** chesthundi — OpenAI, Groq, Ollama, Anthropic anni same interface tho work chestay
- ✅ **Prompt templates** ready — dynamic prompts easily create cheyyadam
- ✅ **Memory** built-in — conversation history automatically maintain avutundi
- ✅ **Chains** — multiple steps ni pipeline ga connect cheyyadam
- ✅ **Output parsers** — LLM response ni structured format lo convert cheyyadam
- ✅ **Tools & Agents** — LLM ki external tools (search, calculator, database) give cheyyadam

---

## <span style="color:#2B8A3E;"><strong>3) LangChain Core Components — Building Blocks</strong></span>

LangChain lo 5 main building blocks unnay:

### 🧱 Block 1 — LLM / Chat Models

Different AI models ni **same way** lo use cheyyadam.

```python
# Without LangChain — each model different code
openai_client.chat.completions.create(model="gpt-4", ...)
groq_client.chat.completions.create(model="llama3", ...)
anthropic_client.messages.create(model="claude-3", ...)

# With LangChain — same interface, just model change cheyyi
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

model = ChatOpenAI(model="gpt-4")
# OR
model = ChatGroq(model="llama3-8b-8192")

# Usage same ga untundi — model change chessinа code change avvadu
response = model.invoke("What is AI?")
```

**Key benefit:** Model switch chessinа mana application code change avvadu.

---

### 🧱 Block 2 — Prompt Templates

Dynamic prompts easily create cheyyadam.

```python
from langchain_core.prompts import ChatPromptTemplate

# Template once define cheyyi
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a {role}. Answer in {language}."),
    ("human", "{question}")
])

# Different inputs tho reuse cheyyi
filled_prompt = prompt.invoke({
    "role": "Python expert",
    "language": "Telugu",
    "question": "What is a list?"
})
```

Ee template ni anni jagala reuse cheyyadam possible — hardcoded strings raayakkarledu.

---

### 🧱 Block 3 — Output Parsers

LLM string response ni **structured data** lo convert cheyyadam.

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

# String parser — plain text output
parser = StrOutputParser()

# JSON parser — structured output
from langchain_core.pydantic_v1 import BaseModel

class PersonInfo(BaseModel):
    name: str
    age: int
    city: str

parser = JsonOutputParser(pydantic_object=PersonInfo)

# LLM response automatically PersonInfo object ga convert avutundi
result = parser.invoke(llm_response)
print(result.name)  # "Sai"
print(result.age)   # 25
```

LLM string ichindi → Parser structured object ichindi. Code lo easy ga use cheyyadam.

---

### 🧱 Block 4 — Chains (LECL — LangChain Expression Language)

Multiple components ni `|` pipe operator tho **connect** cheyyadam.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{question}")
])

model = ChatGroq(model="llama3-8b-8192")
parser = StrOutputParser()

# Chain — prompt → model → parser
chain = prompt | model | parser

# One call lo anni steps execute avutay
response = chain.invoke({"question": "What is Python?"})
```

**Analogy:**

> Factory assembly line laaga — raw material (input) enter avutundi, each station (component) oka job chesthundi, final product (output) vastuindi.

```
User Input → Prompt Template → LLM Model → Output Parser → Final Answer
    ↓              ↓               ↓              ↓
 "question"    "formatted"    "AI response"   "clean text"
```

---

### 🧱 Block 5 — Memory

Conversation history **automatically** maintain cheyyadam.

```python
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Memory store
store = {}

def get_session_history(session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

# Chain tho memory attach cheyyadam
chain_with_memory = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="question",
    history_messages_key="history"
)

# Same session_id use chesthe — previous conversation remember avutundi
chain_with_memory.invoke(
    {"question": "My name is Sai"},
    config={"configurable": {"session_id": "user_1"}}
)

chain_with_memory.invoke(
    {"question": "What is my name?"},  # "Sai" ani remember chesthundi ✅
    config={"configurable": {"session_id": "user_1"}}
)
```

---

## <span style="color:#E67700;"><strong>4) Real Analogy — Oka Complete Picture</strong></span>

LangChain ni oka **restaurant kitchen** laaga think cheyyi:

| Kitchen Component | LangChain Component | Role |
|---|---|---|
| Chef | LLM (GPT / Groq / Claude) | Actual thinking, answering |
| Recipe book | Prompt Template | How to frame the question |
| Plating style | Output Parser | How to present the answer |
| Order sequence | Chain (LCEL) | Step-by-step process |
| Customer's order history | Memory | Conversation context |
| Delivery, suppliers | Tools / Agents | External world access |

> Oka chef (LLM) chaala talented — kani recipe book (prompt), plating rules (parser), order history (memory) anni lekapothe every dish differently vastundi. LangChain anni ivi oka system lo organize chesthundi.

---

## <span style="color:#C92A2A;"><strong>5) Without LangChain vs With LangChain</strong></span>

### Simple chatbot build cheyyadam:

**Without LangChain:**
```python
import openai, json

client = openai.OpenAI(api_key="...")
history = []

def chat(user_input):
    history.append({"role": "user", "content": user_input})
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "system", "content": "You are helpful"}] + history
    )
    
    answer = response.choices[0].message.content
    history.append({"role": "assistant", "content": answer})
    return answer

# Model switch cheyyadam ante — anni code rewrite cheyyadam
# Memory logic manually maintain cheyyadam
# Output parse manually cheyyadam
```

**With LangChain:**
```python
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

model = ChatGroq(model="llama3-8b-8192")  # One line lo model change

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder("history"),
    ("human", "{question}")
])

chain = RunnableWithMessageHistory(
    prompt | model | StrOutputParser(),
    lambda sid: InMemoryChatMessageHistory(),
    input_messages_key="question",
    history_messages_key="history"
)

# Done — memory, model, prompt anni handle avutay automatically
response = chain.invoke(
    {"question": "Hello!"},
    config={"configurable": {"session_id": "user_1"}}
)
```

**Result:** Less code, more features, easy to maintain, easy to switch models.

---

## <span style="color:#0B7285;"><strong>6) LangChain Ela Fit Avutundi — Ecosystem</strong></span>

```
Your Application
      ↓
 LangChain Framework
      ↓
 ┌────────────────────────────────────────┐
 │  Prompts | Chains | Memory | Parsers  │
 └────────────────────────────────────────┘
      ↓
 Any LLM (OpenAI / Groq / Ollama / Anthropic)
      ↓
 Any Tool (Search / Database / File / API)
      ↓
 Any Output (String / JSON / Object / Stream)
```

**LangChain = Middle layer** — mana application ki LLM world ni connect chesthundi, details hide chesthundi.

---

## <span style="color:#5F3DC4;"><strong>7) Mana Project Lo — Files & What They Do</strong></span>

| File | What it demonstrates |
|---|---|
| `groq_langchain.py` | Groq LLM + LangChain basic setup |
| `llama_langchain.py` | Llama model tho LangChain use cheyyadam |
| `PromptTemplate.py` | Dynamic prompt templates create cheyyadam |
| `OutputParser.py` | LLM response structured ga parse cheyyadam |
| `LECL.py` | Pipe operator tho chains build cheyyadam |
| `memory.py` | Conversation memory maintain cheyyadam |

---

## <span style="color:#2B8A3E;"><strong>8) Summary</strong></span>

```
LLM apps build cheyyadam complex — chaala moving parts untay:
  → Multiple LLM providers
  → Prompt management
  → Memory / conversation history
  → Output parsing
  → Tool integrations
  → Chain multiple steps

Without LangChain:
  → Anni manually code cheyyadam
  → Every model ki different code
  → Boilerplate code chaala
  → Maintain cheyyadam kastam

With LangChain:
  → Ready-made building blocks
  → Same code — any LLM
  → Clean, readable chains
  → Memory built-in
  → Scale cheyyadam easy

Core Components:
  1. LLM / Chat Models   → Any AI model, same interface
  2. Prompt Templates    → Dynamic, reusable prompts
  3. Output Parsers      → Structured responses
  4. Chains (LCEL)       → prompt | model | parser
  5. Memory              → Conversation history
```

<p><span style="color:#364FC7;"><strong>Bottom Line:</strong></span> LangChain ante LLM application ki <strong>skeleton</strong> — mana brain (LLM) ni hands (tools), memory, structure anni ichi oka complete intelligent application ga turn chesthundi. Idi lekapotha LLM just oka text generator — LangChain tho idi oka real, useful, production-ready application avutundi. 🚀</p>

---

*Ee file lo Why LangChain, core components (LLM, Prompts, Parsers, Chains, Memory), real analogies, without vs with LangChain comparison cover chesam.*

---

---

# <span style="color:#0B7285;"><strong>What LangChain Actually Does — File by File Explanation</strong></span>

> Mana project lo unna actual Python files chuddam — prathi file exactly enti chestundо, ela work avutundо, step by step.

---

## <span style="color:#364FC7;"><strong>File 1 — groq_langchain.py</strong></span>

### Idi enti chestundi?

Groq cloud API tho LangChain connect chesi oka simple question ki answer teskutundi.

```
.env file (GROQ_API_KEY)
        ↓
ChatGroq model create
        ↓
SystemMessage + HumanMessage list build
        ↓
llm.invoke(messages) → Groq cloud ki velthundi
        ↓
response.content → Answer print
```

### Step-by-step emi jarugtundi:

**Step 1 — API Key load:**
```python
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
```
`.env` file lo pettina `GROQ_API_KEY` ni read chestundi. Key lekapothe program immediately stop avutundi — silent ga fail avvakunda clear error ivvadaniki.

**Step 2 — Model create:**
```python
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)
```
- `model` → e AI brain use cheyyali
- `temperature=0` → random ledu, predictable answers vastay

**Step 3 — Messages build:**
```python
messages = [
    SystemMessage(content="You are a concise, helpful assistant."),
    HumanMessage(content="In one sentence, what is LangChain?")
]
```
- `SystemMessage` → AI ki rules ivvadam ("ila behave cheyyi")
- `HumanMessage` → actual user question

**Step 4 — Invoke & Print:**
```python
response = llm.invoke(messages)
print(response.content)
```
Full message list Groq cloud ki velthundi → AI answer vastundi → `.content` lo unna text print avutundi.

**Real output example:**
```
LangChain is a framework that simplifies building applications powered by large language models.
```

---

## <span style="color:#5F3DC4;"><strong>File 2 — llama_langchain.py</strong></span>

### Idi enti chestundi?

Internet lekunda **local machine lo** Llama model run chesi interactive chat cheyyagalugutundi. Streaming tho token-by-token answer print avutundi.

```
User types question (terminal lo)
        ↓
History + Input → ChatPromptTemplate lo fill
        ↓
prompt | ChatOllama | StrOutputParser  (chain)
        ↓
chain.stream() → chunk-by-chunk screen lo print
        ↓
HumanMessage + AIMessage → history lo add
        ↓
Loop — next question adugutundi
```

### Key concepts:

**Local model — privacy benefit:**
```python
llm = ChatOllama(model="llama3.2", temperature=0)
```
Data internet ki pampadu — mana laptop lo model run avutundi. Private data ki safe.

**Streaming — real-time output:**
```python
for chunk in chain.stream({"history": history, "input": user_input}):
    print(chunk, end="", flush=True)
    response_parts.append(chunk)
```
Full answer wait cheyyadu — prathi word vastune print chestundi. ChatGPT typing effect same ga.

**Memory — conversation continuity:**
```python
history.append(HumanMessage(content=user_input))
history.append(AIMessage(content="".join(response_parts)))
```
Prathi turn tarvata history lo add chestundi. Next question ki model context gurthupettukuntundi.

**Real conversation:**
```
You: My name is Sai
Llama: Hello Sai! How can I help you?

You: What is my name?
Llama: Your name is Sai!  ✅ (history valla gurthupettukundi)
```

---

## <span style="color:#2B8A3E;"><strong>File 3 — PromptTemplate.py</strong></span>

### Idi enti chestundi?

Dynamic prompts build cheyyadam — variables tho different inputs ki same template reuse cheyyadam. 4 levels chupistundi.

```
Variables (topic, destination, days...)
        ↓
PromptTemplate.from_template()  → placeholder fill
        ↓
format() / format_messages()    → final prompt ready
        ↓
(Model ki pass cheyyadaniki ready)
```

### Level 1 — Single Variable:
```python
prompt = PromptTemplate.from_template("Explain {topic} in simple Telugu.")
formatted = prompt.format(topic="Generative AI")
# Output: "Explain Generative AI in simple Telugu."
```
`{topic}` placeholder — `format()` call chessinappudu actual value fill avutundi.

### Level 2 — Multiple Variables:
```python
prompt = PromptTemplate.from_template("""
Create a {days}-day travel plan for {destination}.
Budget: {budget}, Language: {language}
""")
final = prompt.format(destination="Goa", days=3, budget="Medium", language="English")
```
Oka template — different destinations, days, budgets ki reuse cheyyadam possible.

### Level 3 — Chat Prompt (System + Human):
```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly Telugu teacher."),
    ("human", "Explain {topic}")
])
messages = prompt.format_messages(topic="Prompt Engineering")
```
System role + human role kalisi define — AI ki "ila behave cheyyi" + "ee question ki answer cheyyi" oka sarige.

### Level 4 — History + New Question:
```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="history"),  # past conversation slot
    ("human", "{question}")
])
messages = prompt.format_messages(history=history, question="Where was he born?")
```
`MessagesPlaceholder` → past conversation ikkada inject avutundi → model full context tho answer chesthundi.

---

## <span style="color:#E67700;"><strong>File 4 — OutputParser.py</strong></span>

### Idi enti chestundi?

LLM raw string response ni **structured format** lo convert chestundi. Rendu parsers chupistundi — plain text and JSON.

```
Input variables
        ↓
PromptTemplate → ChatGroq → Parser
        ↓
Part A: StrOutputParser  → clean string
Part B: JsonOutputParser → Python dict
```

### Part A — String Parser:
```python
chain = prompt | model | StrOutputParser()
result = chain.invoke({"topic": "AI"})
print(result)  # → "AI is a field of computer science..."
```
Model response lo extra metadata untundi (tokens, role, etc.) — `StrOutputParser` just clean text matrame istundi.

### Part B — JSON Parser:
```python
json_prompt = PromptTemplate.from_template("""
Analyze this restaurant review: {review}
Return only JSON: {{"sentiment": "...", "reason": "...", "rating": "..."}}
""")

json_chain = json_prompt | model | JsonOutputParser()
result = json_chain.invoke({"review": "Food was tasty but delivery was very late."})

print(result["sentiment"])  # → "Negative"
print(result["reason"])     # → "Late delivery"
print(result["rating"])     # → "2/5"
```
LLM string ga JSON ichindi → `JsonOutputParser` Python dict ga convert chestundi → fields direct ga access cheyyadam.

**Why important:**
```
Without parser:  '{"sentiment": "Negative"}' → raw string, parse manually cheyyali
With parser:      result["sentiment"]         → "Negative"  ✅  direct access
```

---

## <span style="color:#C92A2A;"><strong>File 5 — LECL.py</strong></span>

### Idi enti chestundi?

LCEL (LangChain Expression Language) — `|` pipe operator tho chains build cheyyadam. 3 patterns chupistundi: Simple, Parallel, Passthrough.

```
Part A — Simple Chain:
topic → PromptTemplate → ChatGroq → StrOutputParser → single output

Part B — Parallel Chain:
           ┌→ summary_chain  ─┐
topic ────►├→ examples_chain ─┤→ dict {summary, examples, quiz}
           └→ quiz_chain    ──┘

Part C — Passthrough Chain:
topic ─┬→ RunnablePassthrough → original topic (unchanged)
       └→ summary_chain       → generated summary
         → dict {topic, summary}
```

### Part A — Simple Chain:
```python
chain = prompt | llm | parser
result = chain.invoke({"topic": "Generative AI"})
```
Pipe `|` operator — left side output right side ki input ga velthundi. Assembly line exact ga.

### Part B — RunnableParallel (3 outputs at once):
```python
parallel_chain = RunnableParallel({
    "summary":  summary_prompt  | llm | parser,
    "examples": examples_prompt | llm | parser,
    "quiz":     quiz_prompt     | llm | parser
})
result = parallel_chain.invoke({"topic": "Generative AI"})
print(result["summary"])   # → 3 line summary
print(result["examples"])  # → 3 real examples
print(result["quiz"])      # → 3 quiz questions
```
Oka API call wait cheyyakunda — **3 chains parallel ga run** avutay → time save.

### Part C — RunnablePassthrough (original + transformed):
```python
chain = RunnableParallel({
    "topic":   RunnablePassthrough(),  # original input unchanged ga
    "summary": summary_chain           # transformed output
})
result = chain.invoke("LangChain")
print(result["topic"])    # → "LangChain"  (unchanged)
print(result["summary"])  # → "LangChain is a framework..."
```
Original input ni lose cheyyakunda, transformed output tho patu keep cheyyadam.

---

## <span style="color:#0B7285;"><strong>File 6 — memory.py</strong></span>

### Idi enti chestundi?

Memory undi vs ledu difference chupistundi — 3 approaches through.

```
Part A — No Memory:
  llm.invoke("My name is Sai")   → OK
  llm.invoke("What is my name?") → "I don't know" ❌ (forgot)

Part B — Manual History List:
  chat_history = [HumanMessage, AIMessage, HumanMessage...]
  llm.invoke(chat_history) → context tho answer ✅

Part C — ConversationBufferMemory (legacy auto):
  ConversationChain(llm, memory) → auto manage ✅
```

### Part A — Memory lekapothe:
```python
response1 = llm.invoke("My name is Sai.")
response2 = llm.invoke("What is my name?")
# → "I don't know your name." ❌
```
Prathi `invoke` fresh start — previous conversation AI ki teliyadu.

### Part B — Manual list tho memory:
```python
chat_history = []
chat_history.append(HumanMessage(content="My name is Sangeeth."))
response = llm.invoke(chat_history)
chat_history.append(AIMessage(content=response.content))

chat_history.append(HumanMessage(content="What is my name?"))
response = llm.invoke(chat_history)
print(response.content)  # → "Your name is Sangeeth." ✅
```
Full history pass chestunnamu kabatti model context ni chusi correct ga answer chesthundi.

### Part C — ConversationBufferMemory (auto):
```python
memory = ConversationBufferMemory()
conversation = ConversationChain(llm=llm, memory=memory, verbose=True)

conversation.predict(input="My name is Sangeeth.")
conversation.predict(input="What is my name?")  # → "Sangeeth" ✅

print(memory.buffer)  # Full conversation transcript chupistundi
```
Manual append chessukovadam avasaram ledu — chain automatic ga memory maintain chesthundi.

---

## <span style="color:#5F3DC4;"><strong>All Files Together — How They Connect</strong></span>

```
groq_langchain.py   → Foundation: LLM connect ela cheyyadam
        ↓
PromptTemplate.py   → Better input: prompts dynamic ga build cheyyadam
        ↓
OutputParser.py     → Better output: responses structure cheyyadam
        ↓
LECL.py            → Chain: anni pieces | pipe tho connect cheyyadam
        ↓
memory.py          → State: conversation history maintain cheyyadam
        ↓
llama_langchain.py → Real app: anni concepts kalisi — local, streaming, memory
```

Prathi file oka concept add chestundi. Last file (`llama_langchain.py`) anni concepts oka real working app lo use chesindi — local model, streaming, memory, chain, prompt anni oka sarige.

---

## <span style="color:#E67700;"><strong>Final Summary — Oka Line Each</strong></span>

| File | What it actually does |
|---|---|
| `groq_langchain.py` | Groq cloud model ni call chesi oka question ki answer print chestundi |
| `llama_langchain.py` | Local Llama model tho streaming + memory tho interactive chat chestundi |
| `PromptTemplate.py` | Variables tho dynamic prompts build cheyyadam — 4 levels chupistundi |
| `OutputParser.py` | LLM output ni plain text ga and JSON dict ga parse chestundi |
| `LECL.py` | `\|` pipe tho chains build chestundi — simple, parallel, passthrough |
| `memory.py` | Memory ledu vs manual list vs auto buffer — 3 approaches compare chestundi |

<p><span style="color:#C92A2A;"><strong>One line truth:</strong></span> Ee files anni <strong>oka concept씩</strong> nerpisthay — LLM connect cheyyadam → Prompt frame cheyyadam → Output parse cheyyadam → Chain build cheyyadam → Memory maintain cheyyadam. Anni kaliste oka complete LangChain application ready. 🎯</p>

---

*Ee section lo actual project files (groq_langchain, llama_langchain, PromptTemplate, OutputParser, LECL, memory) step-by-step ela work avutayо explain chesam.*

---

---

# <span style="color:#0B7285;"><strong>.env File — API Keys Setup</strong></span>

---

## <span style="color:#364FC7;"><strong>1) .env File Ante Enti?</strong></span>

`.env` file lo **secret API keys** store chestam — source code lo directly raayam.

**Why?**
- API keys ni code lo hardcode chesthe → GitHub ki push chesthe world ki visible avutundi → **security risk**
- `.env` file ni `.gitignore` lo add chestam → keys safe ga untay
- Different environments (dev, prod) ki different keys use cheyyachu — code change cheyyakarledu

---

## <span style="color:#5F3DC4;"><strong>2) Mana Project .env Structure</strong></span>

```ini
# Groq Cloud LLM API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic Claude API Key
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx

# LangSmith (LangChain tracing & observability) API Key
LANGCHAIN_API_KEY=lsv2_pt_xxxxxxxxxxxxxxxxxxxx

# LangSmith Project Name — runs group chessukovadam kosam
LANGCHAIN_PROJECT=GENAIAPPWITHCLAUDE
```

### 3 keys — 3 different services:

| Key | Service | Use |
|-----|---------|-----|
| `GROQ_API_KEY` | **Groq Cloud** | Fast LLM inference — Llama, Mixtral models cloud lo run cheyyataniki |
| `CLAUDE_API_KEY` | **Anthropic Claude** | Claude AI models (claude-3-opus, claude-3-sonnet) use cheyyataniki |
| `LANGCHAIN_API_KEY` | **LangSmith** | LangChain traces, runs, prompts monitor cheyyataniki |
| `LANGCHAIN_PROJECT` | **LangSmith Project** | LangSmith dashboard lo runs group chessukovadam — `GENAIAPPWITHCLAUDE` |

---

## <span style="color:#2B8A3E;"><strong>3) Groq API Key — What It Does</strong></span>

**Groq** = Cloud platform that runs LLMs extremely fast using custom hardware (LPU chips).

```python
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()  # .env file read chestundi

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY")  # .env nundi key teesukuntundi
)
```

- `gsk_` tho start avutundi — Groq API key prefix
- **Free tier available** — limited requests per minute
- Get it: https://console.groq.com

---

## <span style="color:#E67700;"><strong>4) Claude API Key — What It Does</strong></span>

**Anthropic Claude** = Powerful AI models by Anthropic — claude-3-opus, claude-3-sonnet, claude-3-haiku.

```python
from langchain_anthropic import ChatAnthropic
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatAnthropic(
    model="claude-3-5-sonnet-20241022",
    api_key=os.getenv("CLAUDE_API_KEY")  # .env nundi key teesukuntundi
)

response = llm.invoke("What is LangChain?")
print(response.content)
```

- `sk-ant-api03-` tho start avutundi — Anthropic key prefix
- **Paid service** — free credits tho start cheyyachu
- Get it: https://console.anthropic.com

---

## <span style="color:#C92A2A;"><strong>5) LangSmith API Key — What It Does</strong></span>

**LangSmith** = LangChain team develop chesina **observability & debugging platform**.

LangChain application run chessinappudu — LangSmith:
- Every LLM call track chesthundi
- Input → Output chustundi
- Latency, token usage chupistundi
- Prompt versions manage cheyyadam
- Chains debug cheyyadam — eppati emi jarigindo chupistundi

```python
import os
from dotenv import load_dotenv

load_dotenv()

# LangSmith enable cheyyadaniki environment variables set cheyyadam
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "my-langchain-project")  # project name

# Ika normal ga LangChain use cheyyandi — automatically track avutundi
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatGroq(model="llama-3.1-8b-instant")
chain = ChatPromptTemplate.from_messages([("human", "{question}")]) | llm | StrOutputParser()

result = chain.invoke({"question": "What is Python?"})
print(result)
# LangSmith dashboard lo ee run trace ga kanipistundi
```

- `lsv2_pt_` tho start avutundi — LangSmith key prefix
- **Free tier available**
- Dashboard: https://smith.langchain.com

### LANGCHAIN_PROJECT — `GENAIAPPWITHCLAUDE`

LangSmith dashboard lo **anni runs oka project lo group** chestundi.

```ini
LANGCHAIN_PROJECT=GENAIAPPWITHCLAUDE
```

```python
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT")
# → "GENAIAPPWITHCLAUDE"
```

- LangSmith site lo left panel lo **"GENAIAPPWITHCLAUDE"** project name tho folder laaga kanipistundi
- Aa project click chesthe — mana application lo jarugina **prathi LLM call, chain run, prompt** anni trace ga listlo untay
- Multiple projects create cheyyachu — different apps or experiments separate ga track cheyyataniki
- `.env` lo set chessinamu kabatti — code lo hardcode cheyyakarledu

---

## <span style="color:#0B7285;"><strong>6) .env File load cheyyadam — dotenv</strong></span>

```python
from dotenv import load_dotenv
import os

# .env file lo unna variables ni os.environ lo load chestundi
load_dotenv()

# Ika anywhere in code use cheyyachu
groq_key     = os.getenv("GROQ_API_KEY")
claude_key   = os.getenv("CLAUDE_API_KEY")
langchain_key = os.getenv("LANGCHAIN_API_KEY")
```

**`load_dotenv()` ela work chesthundi:**
```
.env file read chestundi
    ↓
Key=Value pairs parse chestundi
    ↓
os.environ lo set chestundi
    ↓
os.getenv("KEY") tho anywhere access cheyyachu
```

Install: `pip install python-dotenv`

---

## <span style="color:#5F3DC4;"><strong>7) .env Safety Rules</strong></span>

```
# .gitignore lo add cheyyi — MUST
.env

# .env.example create cheyyi — keys lekapotha structure chupiyyadam kosam
# .env.example (safe to commit — no real keys)
GROQ_API_KEY=your_groq_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
LANGCHAIN_API_KEY=your_langsmith_api_key_here
```

| Rule | Reason |
|------|--------|
| Never commit `.env` | Real keys GitHub ki velthay — compromised |
| Always add to `.gitignore` | Git track cheyyadu |
| Create `.env.example` | Team members ki structure telustundi, keys ledu |
| Never hardcode in `.py` files | Code review lo visible avutundi |

---

## <span style="color:#2B8A3E;"><strong>8) Summary</strong></span>

```
Mana project lo 3 API keys:

GROQ_API_KEY       → Groq cloud lo fast LLM inference
                     gsk_ prefix
                     groq_langchain.py lo use avutundi

CLAUDE_API_KEY     → Anthropic Claude models
                     sk-ant-api03- prefix
                     ChatAnthropic() tho use cheyyachu

LANGCHAIN_API_KEY  → LangSmith tracing & observability
                     lsv2_pt_ prefix
                     LANGCHAIN_TRACING_V2=true set chesthe auto-track

LANGCHAIN_PROJECT  → LangSmith lo project/folder name
                     GENAIAPPWITHCLAUDE
                     Anni runs ee project lo grouped avutay

Load cheyyadam:
  from dotenv import load_dotenv
  load_dotenv()
  os.getenv("KEY_NAME")

Safety:
  .env → .gitignore lo add cheyyi
  .env.example → commit cheyyi (no real keys)
```

<p><span style="color:#364FC7;"><strong>Bottom Line:</strong></span> Mana project ippudu 3 powerful services tho connected — <strong>Groq</strong> (fast LLM), <strong>Claude</strong> (powerful LLM), <strong>LangSmith</strong> (observability). Anni keys <code>.env</code> lo safe ga store chesam — code lo eppudu raayam. 🔐</p>

---

*Ee section lo .env file, GROQ_API_KEY (Groq), CLAUDE_API_KEY (Anthropic), LANGCHAIN_API_KEY (LangSmith), dotenv usage, safety rules cover chesam.*
