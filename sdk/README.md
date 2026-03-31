# ContextMind SDKs

Four official client libraries for the ContextMind API.

| SDK | File | Runtime | Dependencies |
|-----|------|---------|--------------|
| **Python** | `python/contextmind.py` | Python 3.8+ | `requests` |
| **JavaScript** | `javascript/contextmind.js` | Node.js 18+, Deno, Bun, Browser | None |
| **TypeScript** | `typescript/contextmind.ts` | Node.js 18+, Deno, Bun, Browser | None |
| **React** | `react/contextmind-react.tsx` | React 18+ | React |

All SDKs implement the same interface:

```
cm.peers.create / list / get / update / delete
cm.sessions.create / list / get / update / close / delete
cm.ingest(sessionId, messages, reasoningLevel?)   → IngestResult
cm.context(sessionId, maxTokens?, ...)            → ContextResponse
cm.infer(peerId, question, keys?)                 → InferResponse
```

See individual `README.md` files in each subfolder for examples.

## Shared concepts

### Authentication
All SDKs authenticate with your workspace API key (`ctxmind_...`).
Pass it as `api_key` / `apiKey` in the constructor — the SDK adds the `x-api-key` header automatically.

### Context response
The `context()` method returns a `ContextResponse` object with:
- `recent_messages` / `recentMessages` — verbatim recent messages (60% of token budget)
- `summary` — compressed history summary (40% of token budget)
- `representations` — Theory of Mind insights ordered by confidence
- `compression_ratio` / `compressionRatio` — e.g. 0.09 = 91% token savings
- `savings_percent` / `savingsPercent` — convenience shorthand
- `to_openai_messages()` / `toOpenAIMessages()` — builds ready-to-use OpenAI messages array

### Infer response
The `infer()` method returns:
- `answer` — synthesized insight about the peer
- `confidence` — average confidence (0–100) of the sources used
- `sourced_from` / `sourcedFrom` — which representation keys were used
- `peer_name` / `peerName` — display name of the queried peer

### Error types
All SDKs expose typed error classes:
- `AuthError` (401) — invalid or missing API key
- `NotFoundError` (404) — resource not found
- `ValidationError` (400) — invalid request data
- `ContextMindError` — base class for all errors
