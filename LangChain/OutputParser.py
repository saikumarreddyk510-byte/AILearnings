# `.env` load chesi API keys use cheyyadaniki import.
from dotenv import load_dotenv
# Output ni plain text string ga parse cheyyadaniki parser import.
from langchain_core.output_parsers import StrOutputParser
# Groq chat model use cheyyadaniki import.
from langchain_groq import ChatGroq
# Prompt templates create cheyyadaniki import.
from langchain_core.prompts import PromptTemplate

# Step 1: Environment variables load cheyyi.
load_dotenv()

# Step 2: Topic variable use chese prompt create chestunnam.
prompt = PromptTemplate.from_template("Explain {topic} to a 5th grade student in single sentence.")

# Step 3: Groq model object create chestunnam.
model = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# Step 4: Plain text parser create.
parser = StrOutputParser()

# Step 5: Prompt -> model -> parser chain build.
chain = prompt | model | parser

# Step 6: Topic value ichi answer generate.
result = chain.invoke({"topic": "AI"})
# Result print.
print(result)

# ---------------- JSON Output Parser ----------------
# JSON format output ni parse cheyyadaniki import.
from langchain_core.output_parsers import JsonOutputParser

# Review analysis kosam strict JSON return cheyyamani prompt design chestunnam.
json_prompt = PromptTemplate.from_template("""
Analyze this restaurant review.

Review: {review}

Return only JSON with these keys:
{{
  "sentiment": "Positive / Negative / Neutral",
  "reason": "short reason",
  "rating": "rating out of 5"
}}
""")

# JSON parser create.
json_parser = JsonOutputParser()

# JSON prompt + model + json parser chain build.
json_chain = json_prompt | model | json_parser

# Sample review pass chesi JSON result tiskuntam.
json_result = json_chain.invoke({
    "review": "Food was tasty but delivery was very late."
})

# Full JSON object print.
print(json_result)
# Individual fields print cheyyadam easy understanding kosam.
print(json_result["sentiment"])
print(json_result["reason"])
print(json_result["rating"])
