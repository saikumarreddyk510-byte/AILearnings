from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

load_dotenv()

prompt = PromptTemplate.from_template("Explain {topic} to a 5th grade student in single sentence.")

model = ChatGroq(model = "llama-3.1-8b-instant", temperature = 0)

parser = StrOutputParser()

chain = prompt | model | parser

result = chain.invoke({"topic" : "AI"})
print(result)

########################### JSON Output Parser ###########################
from langchain_core.output_parsers import JsonOutputParser

json_prompt = PromptTemplate.from_template( """
Analyze this restaurant review.

Review: {review}

Return only JSON with these keys:
{{
  "sentiment": "Positive / Negative / Neutral",
  "reason": "short reason",
  "rating": "rating out of 5"
}}

""")

json_parser = JsonOutputParser()

json_chain = json_prompt | model | json_parser

json_result = json_chain.invoke({
    "review": "Food was tasty but delivery was very late."
})
print(json_result)
print(json_result["sentiment"])
print(json_result["reason"])
print(json_result["rating"])
