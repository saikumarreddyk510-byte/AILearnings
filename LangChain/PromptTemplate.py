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
