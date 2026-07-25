# ---------------- Architecture Diagram ----------------
# [Variables Input]
#    |
#    +--> [PromptTemplate.format] -> [Formatted Text]
#    |
#    +--> [ChatPromptTemplate.from_messages] -> [Message Objects]
#    |
#    +--> [MessagesPlaceholder + history + question]
#              |
#              v
#        [Final multi-turn prompt messages]
#
# ---------------- Deep Architecture Notes (Kid-Friendly) ----------------
# I file prompt building fundamentals ni 4 levels lo chupistundi.
#
# Level 1: Single Variable Prompt
# Step 1: Template string lo `{topic}` placeholder pettam.
# Step 2: `format(topic=...)` call chesi final string create chestam.
#
# Level 2: Multi Variable Prompt
# Step 1: `destination`, `days`, `budget`, `language` placeholders define chestam.
# Step 2: Oka sari lo anni values pass chesi personalized prompt create chestam.
#
# Level 3: Chat Prompt
# Step 1: `system` and `human` roles define chestam.
# Step 2: `format_messages()` dvara chat-ready message objects create chestam.
#
# Level 4: History-Based Chat Prompt
# Step 1: `MessagesPlaceholder` dvara past chat ki slot pettam.
# Step 2: `history` list + new question kalipi final context build chestam.
# Step 3: Follow-up questions ki proper context dorukutundi.
#
# Data Shapes:
# - format output: str
# - format_messages output: list[BaseMessage]
#
# Key idea:
# Prompt quality bagunte model answer quality usually improve avutundi.

# ---------------- Single-Turn Prompt Template ----------------
# PromptTemplate class ni import chestunnam.
from langchain_core.prompts import PromptTemplate

# Oka variable `{topic}` accept chese simple template create chestunnam.
prompt = PromptTemplate.from_template(
    """
Explain {topic}
in simple Telugu.
"""
)

# `topic` variable ki value ichi final prompt text generate chestunnam.
formatted_prompt = prompt.format(
    topic="Generative AI"
)

# Generated prompt print.
print(formatted_prompt)

# ---------------- Multi-Variable Prompt Template ----------------
# Inko template lo multiple variables vadutunnam.
prompt = PromptTemplate.from_template(
    """
Create a {days}-day travel plan for {destination}.

Budget: {budget}

Language: {language}
"""
)

# Dynamic values pass chesi final travel prompt generate.
final_prompt = prompt.format(
    destination="Goa",
    days=3,
    budget="Medium",
    language="English"
)

# Multi-variable final prompt print.
print(final_prompt)

# ---------------- Chat Prompt Template ----------------
# Chat style prompt building kosam ChatPromptTemplate import.
from langchain_core.prompts import ChatPromptTemplate

# System + human roles tho chat template create chestunnam.
prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a friendly Telugu teacher."
    ),
    (
        "human",
        "Explain {topic}"
    )
])

# Topic value ichi message objects build chestunnam.
messages = prompt.format_messages(
    topic="Prompt Engineering"
)

# Generated chat messages print.
print(messages)

# ---------------- Multi-Turn Chat / Conversation ----------------
# HumanMessage class import for manual chat history.
from langchain_core.messages import HumanMessage

# I list lo two user turns create chestunnam.
messages = [
    HumanMessage(
        content="Who is Virat Kohli?"
    ),
    HumanMessage(
        content="Where was he born?"
    )
]

# ---------------- ChatPromptTemplate + History ----------------
# Placeholder tho past history inject cheyyadaniki imports.
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder
)

# History + new question combine chese advanced chat template.
prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a helpful assistant."
    ),
    MessagesPlaceholder(
        variable_name="history"
    ),
    (
        "human",
        "{question}"
    )
])

# Previous conversation history simulate chestunnam.
history = [
    HumanMessage(
        content="Who is Virat Kohli?"
    )
]

# History + current question ichi final messages generate.
messages = prompt.format_messages(
    history=history,
    question="Where was he born?"
)

# Final generated message objects print.
print(messages)
