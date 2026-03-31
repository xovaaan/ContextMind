# ContextMind Python SDK

```bash
pip install requests
```

Copy `contextmind.py` into your project.

## Quickstart

```python
from contextmind import ContextMind

cm = ContextMind(
    api_key="ctxmind_your_key",
    base_url="https://your-contextmind.com"  # or http://localhost:3000 for local dev
)

# 1. Create a peer
peer = cm.peers.create(name="Alice", type="user")

# 2. Create a session
session = cm.sessions.create(peer_id=peer["id"], name="Support chat")

# 3. Ingest messages after each conversation turn
result = cm.ingest(
    session_id=session["id"],
    messages=[
        {"role": "user", "content": "I prefer bullet points over long paragraphs"},
        {"role": "assistant", "content": "Understood, keeping it concise."},
        {"role": "user", "content": "I am a senior Python engineer working on ML pipelines"},
    ],
    reasoning_level="medium"
)
print(f"Tokens: {result['tokensIngested']}, Cost: ${result['cost']:.8f}")
print(f"Insights extracted: {result['representationsExtracted']}")

# 4. Get compressed context before every LLM call
ctx = cm.context(session_id=session["id"], max_tokens=8000)
print(f"Token savings: {ctx.savings_percent}%")
print(f"Summary: {ctx.summary}")

# 5. Pass directly to OpenAI
import openai
messages = ctx.to_openai_messages("You are a helpful assistant.")
response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[*messages, {"role": "user", "content": user_input}]
)

# 6. Infer insights about the peer
result = cm.infer(
    peer_id=peer["id"],
    question="How should I explain technical concepts to this user?"
)
print(result.answer)
print(f"Confidence: {result.confidence}%")
```

## Reasoning Levels

| Level | Confidence Threshold | Use Case |
|-------|---------------------|----------|
| `minimal` | 90% | Basic facts only (name, location) |
| `low` | 80% | Standard recall |
| `medium` | 70% | Balanced extraction (default) |
| `high` | 60% | Complex insights, motivations |
| `max` | 50% | Deep psychological profiling |
