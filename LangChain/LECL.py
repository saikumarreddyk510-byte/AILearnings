from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3
)

prompt = PromptTemplate.from_template(
    "Create a short blog intro about {topic} in simple Telugu."
)

parser = StrOutputParser()

chain = prompt | llm | parser # runnable

result = chain.invoke({
    "topic": "Generative AI"
})

print(result)

########################### Runnable Parallel ###########################
summary_prompt = PromptTemplate.from_template(
    "Summarize {topic} in 3 simple lines."
)

examples_prompt = PromptTemplate.from_template(
    "Give 3 real-world examples of {topic}."
)

quiz_prompt = PromptTemplate.from_template(
    "Create 3 quiz questions about {topic}."
)

summary_chain = summary_prompt | llm | parser
examples_chain = examples_prompt | llm | parser
quiz_chain = quiz_prompt | llm | parser

parallel_chain = RunnableParallel({
    "summary": summary_chain,
    "examples": examples_chain,
    "quiz": quiz_chain
})

result = parallel_chain.invoke({
    "topic": "Generative AI"
})

print(result["summary"])
print(result["examples"])
print(result["quiz"])

########################### Runnable Passthrough ###########################
summary_prompt = PromptTemplate.from_template(
    "Write a 20 words summary about {topic}."
)

summary_chain = summary_prompt | llm | parser

chain = RunnableParallel({
    "topic": RunnablePassthrough(),
    "summary": summary_chain
})

result = chain.invoke("LangChain")

print("Original Topic:", result["topic"])
print("Generated Summary:", result["summary"])
