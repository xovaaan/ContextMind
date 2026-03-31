# ContextMind

**AI-native memory platform. Reduce LLM token burn by 90%.**

ContextMind sits between your app and your LLM. It ingests conversation history, auto-generates summaries, extracts psychological profiles via Theory of Mind, and returns perfect compressed context — every call.

---

## Quickstart

### 1. Install & configure

```bash
npm install
cp .env.local .env.local.example  # fill in your keys
```

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Set up the database

Enable pgvector in NeonDB:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Push schema:
```bash
npm run db:push
```

### 3. Run

```bash
npm run dev
# → http://localhost:3000
# → http://localhost:3000/docs (full documentation)
```

---

## API Reference (short version)

All routes (except `/api/workspaces`) authenticate via `x-api-key` header.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ingest` | Ingest messages, auto-summarize, extract Theory of Mind |
| GET | `/api/context` | Get compressed context (always FREE) |
| POST | `/api/infer` | Query peer profile in natural language |
| CRUD | `/api/peers` | Manage peers (users, agents, objects) |
| CRUD | `/api/sessions` | Manage conversation sessions |
| CRUD | `/api/workspaces` | Manage workspaces (Clerk auth) |

Full documentation with examples: `/docs`

---

## SDKs

| SDK | Location | Dependencies |
|-----|----------|--------------|
| Python | `sdk/python/contextmind.py` | `requests` |
| JavaScript | `sdk/javascript/contextmind.js` | None (native fetch) |
| TypeScript | `sdk/typescript/contextmind.ts` | None (native fetch) |
| React | `sdk/react/contextmind-react.tsx` | React 18+ |

### Python
```python
from contextmind import ContextMind
cm = ContextMind(api_key="ctxmind_...", base_url="http://localhost:3000")

peer = cm.peers.create(name="Alice", type="user")
session = cm.sessions.create(peer_id=peer["id"])
cm.ingest(session_id=session["id"], messages=[...])

ctx = cm.context(session_id=session["id"])
print(f"{ctx.savings_percent}% token savings")

insight = cm.infer(peer_id=peer["id"], question="What tone does this user prefer?")
print(insight.answer)
```

### JavaScript / TypeScript
```js
import { ContextMind } from './sdk/javascript/contextmind.js'
const cm = new ContextMind({ apiKey: 'ctxmind_...' })

const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
const session = await cm.sessions.create({ peerId: peer.id })
await cm.ingest({ sessionId: session.id, messages: [...] })

const ctx = await cm.context({ sessionId: session.id })
const messages = ctx.toOpenAIMessages('You are a helpful assistant.')

const insight = await cm.infer({ peerId: peer.id, question: 'What communication style?' })
```

### React
```tsx
import { ContextMindProvider, useContextMind, useIngest, useInfer } from './sdk/react/contextmind-react'

// Wrap app:
<ContextMindProvider apiKey="ctxmind_..."><App /></ContextMindProvider>

// In components:
const { context, loading } = useContextMind(sessionId)
const { ingest } = useIngest()
const { infer, result } = useInfer(peerId)
```

---

## Reasoning Levels

| Level | Threshold | Use Case |
|-------|-----------|----------|
| `minimal` | 90% | Basic facts only |
| `low` | 80% | Standard recall |
| `medium` | 70% | Default — balanced extraction |
| `high` | 60% | Complex insights |
| `max` | 50% | Deep psychological profiling |

---

## Pricing

- **$2 per million tokens ingested**
- Context retrieval (`GET /api/context`): **FREE, unlimited**
- Infer queries (`POST /api/infer`): **FREE, unlimited**
- ~90% token savings vs sending full history

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to NeonDB
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
```
