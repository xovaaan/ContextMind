'use client'
import { useState } from 'react'
import Link from 'next/link'

type Section =
  | 'overview' | 'quickstart' | 'ingest' | 'context'
  | 'infer' | 'peers' | 'sessions' | 'sdk-python'
  | 'sdk-js' | 'sdk-ts' | 'sdk-react' | 'reasoning' | 'errors'

const NAV: { label: string; id: Section; group?: string }[] = [
  { label: 'Overview', id: 'overview' },
  { label: 'Quickstart', id: 'quickstart' },
  { label: 'POST /api/ingest', id: 'ingest', group: 'API Reference' },
  { label: 'GET /api/context', id: 'context', group: 'API Reference' },
  { label: 'POST /api/infer', id: 'infer', group: 'API Reference' },
  { label: 'Peers', id: 'peers', group: 'API Reference' },
  { label: 'Sessions', id: 'sessions', group: 'API Reference' },
  { label: 'Python SDK', id: 'sdk-python', group: 'SDKs' },
  { label: 'JavaScript SDK', id: 'sdk-js', group: 'SDKs' },
  { label: 'TypeScript SDK', id: 'sdk-ts', group: 'SDKs' },
  { label: 'React SDK', id: 'sdk-react', group: 'SDKs' },
  { label: 'Reasoning Levels', id: 'reasoning', group: 'Concepts' },
  { label: 'Error Handling', id: 'errors', group: 'Concepts' },
]

function Code({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-800 my-4">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-800">
        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-xs text-slate-500 hover:text-white transition px-2 py-1 rounded hover:bg-slate-700">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-950 p-5 text-sm text-green-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">{code.trim()}</pre>
    </div>
  )
}

function Badge({ children, color = 'blue' }: { children: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
}

function Param({ name, type, required, children }: { name: string; type: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <code className="text-blue-600 font-mono text-sm font-semibold">{name}</code>
        <code className="text-slate-500 font-mono text-xs">{type}</code>
        {required && <Badge color="red">required</Badge>}
      </div>
      <p className="text-slate-600 text-sm">{children}</p>
    </div>
  )
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-2xl font-extrabold text-slate-900 tracking-tight mt-12 mb-4 pt-2 scroll-mt-8">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-slate-800 mt-8 mb-3">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-14 flex items-center px-6 gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">CM</div>
          <span className="font-bold text-slate-900">ContextMind</span>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="text-slate-600 text-sm font-medium">Documentation</span>
        <div className="ml-auto flex gap-4 text-sm">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition">Dashboard</Link>
          <Link href="/sign-up" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">Get Started</Link>
        </div>
      </nav>

      <div className="flex pt-14 flex-1">
        {/* Sidebar */}
        <aside className="w-64 fixed top-14 bottom-0 overflow-y-auto bg-slate-50 border-r border-slate-200 py-6 px-4">
          {(() => {
            const groups: string[] = []
            return NAV.map((item) => {
              const showGroup = item.group && !groups.includes(item.group)
              if (showGroup && item.group) groups.push(item.group)
              return (
                <div key={item.id}>
                  {showGroup && (
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mt-5 mb-2">{item.group}</div>
                  )}
                  <button
                    onClick={() => {
                      setActiveSection(item.id)
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                    {item.label}
                  </button>
                </div>
              )
            })
          })()}
        </aside>

        {/* Main content */}
        <main className="ml-64 flex-1 px-12 py-10 max-w-4xl">

          {/* Overview */}
          <H2 id="overview">Overview</H2>
          <P>
            ContextMind is an AI-native memory platform that sits between your application and your LLM.
            Instead of sending full conversation history on every call — which grows linearly and burns tokens —
            ContextMind compresses history into summaries, extracts psychological insights via Theory of Mind,
            and returns only the most relevant context within your token budget.
          </P>
          <P>
            The result: <strong>~90% reduction in LLM token costs</strong> with richer, more personalised context than raw history provides.
          </P>
          <div className="grid grid-cols-3 gap-4 my-6">
            {[
              { label: 'Ingest Cost', value: '$2 / 1M tokens', color: 'blue' },
              { label: 'Context Retrieval', value: 'Always FREE', color: 'green' },
              { label: 'Token Savings', value: '~90%', color: 'purple' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <div className={`text-xl font-extrabold text-${s.color}-600`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <H3>How it works</H3>
          <div className="bg-slate-950 text-green-300 font-mono text-sm rounded-xl p-6 leading-loose">
            {`Your App                ContextMind                Your LLM
─────────               ────────────               ────────
New message  →  POST /api/ingest
                  ↓ Store message
                  ↓ Count tokens (js-tiktoken)
                  ↓ Auto-summarize every 20 msgs (1K tokens)
                  ↓ Auto-summarize every 60 msgs (4K tokens)
                  ↓ Extract Theory of Mind representations
                  ↓ Generate vector embeddings

Before LLM   →  GET /api/context
                  ↓ 60% budget → recent messages (verbatim)
                  ↓ 40% budget → latest summary
                  ↓ Append representations (Theory of Mind)
                  → Returns ~743 tokens        →  GPT-4o
                    (not 8,200)                    pays for 743`}
          </div>

          {/* Quickstart */}
          <H2 id="quickstart">Quickstart</H2>
          <P>Get from zero to ingesting and retrieving context in under 5 minutes.</P>

          <H3>1. Create a workspace and get your API key</H3>
          <P>Sign up at <Link href="/sign-up" className="text-blue-600 hover:underline">contextmind.app</Link>, create a workspace, and copy your API key from the dashboard. It starts with <code className="text-blue-600 font-mono bg-blue-50 px-1 rounded">ctxmind_</code>.</P>

          <H3>2. Create a peer</H3>
          <Code lang="bash" code={`curl -X POST https://your-app.com/api/peers \\
  -H "x-api-key: ctxmind_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "type": "user"}'

# Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice",
  "type": "user",
  "workspaceId": "...",
  "createdAt": "2024-01-15T10:00:00Z"
}`} />

          <H3>3. Create a session</H3>
          <Code lang="bash" code={`curl -X POST https://your-app.com/api/sessions \\
  -H "x-api-key: ctxmind_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"peerId": "550e8400-...", "name": "Support chat #1"}'

# Response:
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "peerId": "550e8400-...",
  "messageCount": 0,
  "isActive": true
}`} />

          <H3>4. Ingest messages</H3>
          <Code lang="bash" code={`curl -X POST https://your-app.com/api/ingest \\
  -H "x-api-key: ctxmind_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "7c9e6679-...",
    "messages": [
      {"role": "user", "content": "I prefer bullet points, not long paragraphs"},
      {"role": "assistant", "content": "Understood. Keeping it concise."},
      {"role": "user", "content": "I am a senior Python engineer working on ML pipelines"}
    ],
    "reasoningLevel": "medium"
  }'

# Response:
{
  "success": true,
  "messageIds": ["uuid1", "uuid2", "uuid3"],
  "tokensIngested": 312,
  "summaryGenerated": false,
  "representationsExtracted": 2,
  "cost": 0.000000624
}`} />

          <H3>5. Retrieve compressed context</H3>
          <Code lang="bash" code={`curl "https://your-app.com/api/context?sessionId=7c9e6679-...&maxTokens=8000" \\
  -H "x-api-key: ctxmind_your_key"

# Response:
{
  "recentMessages": [...],
  "summary": "Alice is a senior Python/ML engineer who prefers concise bullet-point answers...",
  "representations": [
    {"key": "communication_style", "value": "Prefers bullet points", "confidence": 92},
    {"key": "expertise", "value": "Senior Python, ML pipelines", "confidence": 88}
  ],
  "totalTokens": 743,
  "compressionRatio": 0.09
}`} />

          <H3>6. Query the peer profile (Infer API)</H3>
          <Code lang="bash" code={`curl -X POST https://your-app.com/api/infer \\
  -H "x-api-key: ctxmind_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "peerId": "550e8400-...",
    "question": "How should I explain technical concepts to this user?"
  }'

# Response:
{
  "answer": "Alice is a senior engineer — skip basics entirely. Use code examples, keep explanations to 2-3 sentences max. Bullet points preferred over prose.",
  "confidence": 88,
  "sourcedFrom": ["expertise", "communication_style"],
  "peerName": "Alice",
  "totalRepresentations": 4
}`} />

          {/* POST /api/ingest */}
          <H2 id="ingest">POST /api/ingest</H2>
          <P>Ingest conversation messages into ContextMind. This is the core write operation. Call it after each turn or in batches.</P>
          <div className="flex gap-2 mb-4">
            <Badge color="blue">POST</Badge>
            <code className="font-mono text-sm text-slate-700">/api/ingest</code>
            <Badge color="amber">Auth required</Badge>
          </div>

          <H3>Headers</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="x-api-key" type="string" required>Your workspace API key. Format: <code className="font-mono text-xs">ctxmind_</code> followed by 32 hex characters.</Param>
          </div>

          <H3>Request body</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="sessionId" type="string (UUID)" required>UUID of the session to ingest messages into. Must belong to your workspace.</Param>
            <Param name="messages" type="array" required>
              Array of message objects. Each object requires <code className="font-mono text-xs text-blue-600">role</code> (<code className="font-mono text-xs">"user" | "assistant" | "system"</code>) and <code className="font-mono text-xs text-blue-600">content</code> (string). Optional: <code className="font-mono text-xs text-blue-600">metadata</code> (object).
            </Param>
            <Param name="reasoningLevel" type='"minimal" | "low" | "medium" | "high" | "max"'>
              Controls Theory of Mind extraction depth and confidence threshold. Default: <code className="font-mono text-xs">"medium"</code> (70% confidence threshold). See Reasoning Levels for full details.
            </Param>
          </div>

          <H3>Response</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="success" type="boolean">Always true on success.</Param>
            <Param name="messageIds" type="string[]">UUIDs of all created messages, in order.</Param>
            <Param name="tokensIngested" type="number">Total tokens counted across all ingested messages (cl100k_base encoding).</Param>
            <Param name="summaryGenerated" type="boolean">True if a short (every 20 msgs) or long (every 60 msgs) summary was auto-generated during this ingest.</Param>
            <Param name="representationsExtracted" type="number">Number of new Theory of Mind insights added to the peer's profile. Existing insights are updated if confidence improves.</Param>
            <Param name="cost" type="number">Estimated cost in USD. Formula: <code className="font-mono text-xs">tokensIngested × 0.000002</code> ($2 per million tokens).</Param>
          </div>

          <Code lang="json" code={`// Example response after hitting the 20-message threshold:
{
  "success": true,
  "messageIds": ["a1b2c3d4-...", "e5f6g7h8-..."],
  "tokensIngested": 428,
  "summaryGenerated": true,
  "representationsExtracted": 1,
  "cost": 0.000000856
}`} />

          {/* GET /api/context */}
          <H2 id="context">GET /api/context</H2>
          <P>Retrieve compressed, token-optimised context for a session. Call this before every LLM API call instead of fetching full message history.</P>
          <div className="flex gap-2 mb-4">
            <Badge color="green">GET</Badge>
            <code className="font-mono text-sm text-slate-700">/api/context</code>
            <Badge color="amber">Auth required</Badge>
            <Badge color="green">FREE</Badge>
          </div>

          <H3>Token budget allocation</H3>
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="font-bold text-blue-700 mb-1">60% → Recent messages</div>
              <div className="text-sm text-blue-600">Verbatim messages, most recent first, until budget exhausted.</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="font-bold text-purple-700 mb-1">40% → Summary</div>
              <div className="text-sm text-purple-600">Latest auto-generated summary (short or long).</div>
            </div>
          </div>

          <H3>Query parameters</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="sessionId" type="string (UUID)" required>UUID of the session to fetch context for.</Param>
            <Param name="maxTokens" type="number">Total token budget. Default: 8000. Max: 32000.</Param>
            <Param name="includeRepresentations" type="boolean">Include Theory of Mind profile in the response. Default: true. Representations use minimal additional tokens.</Param>
            <Param name="includeDocuments" type="boolean">Include semantically matched documents. Default: true.</Param>
            <Param name="query" type="string">Optional semantic search query. When provided, ContextMind uses cosine similarity to find the most relevant summaries and documents (threshold: 0.7).</Param>
          </div>

          <H3>Response</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="recentMessages" type="Message[]">Verbatim messages fitting the 60% token budget, ordered oldest-first for direct use in an LLM messages array.</Param>
            <Param name="summary" type="string | null">Latest auto-generated summary fitting the 40% budget. Null if no summary exists yet (fewer than 20 messages).</Param>
            <Param name="representations" type="Representation[]">Top-10 Theory of Mind insights ordered by confidence. Includes key, value, confidence (0–100), and source message IDs.</Param>
            <Param name="relevantDocuments" type="Document[]">Semantically matched documents (requires query parameter or prior document ingestion).</Param>
            <Param name="totalTokens" type="number">Total tokens in the assembled context package.</Param>
            <Param name="compressionRatio" type="number">Context tokens divided by total historical tokens. E.g. 0.09 = 91% savings. Use this to track efficiency over time.</Param>
          </div>

          <H3>Using the response with OpenAI</H3>
          <Code lang="typescript" code={`const ctx = await fetch('/api/context?sessionId=...&maxTokens=8000', {
  headers: { 'x-api-key': 'ctxmind_...' }
}).then(r => r.json())

// Build system prompt from summary + representations
const systemParts = ['You are a helpful assistant.']
if (ctx.summary) systemParts.push(\`\\n\\nConversation history:\\n\${ctx.summary}\`)
if (ctx.representations.length > 0) {
  const profile = ctx.representations
    .map(r => \`\${r.key}: \${r.value}\`)
    .join('\\n')
  systemParts.push(\`\\n\\nUser profile:\\n\${profile}\`)
}

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemParts.join('') },
    ...ctx.recentMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userInput },
  ],
})

console.log(\`Sent \${ctx.totalTokens} tokens (saved \${Math.round((1 - ctx.compressionRatio) * 100)}%)\`)`} />

          {/* POST /api/infer */}
          <H2 id="infer">POST /api/infer</H2>
          <P>
            The Infer API lets you query a peer's accumulated psychological profile using plain natural language.
            ContextMind reasons over all stored Theory of Mind representations and synthesizes a direct, actionable answer.
          </P>
          <P>
            Use this to personalize LLM system prompts, adapt UI/UX, route support tickets by user preference,
            or answer any question about how to best interact with a specific user or agent.
          </P>
          <div className="flex gap-2 mb-4">
            <Badge color="blue">POST</Badge>
            <code className="font-mono text-sm text-slate-700">/api/infer</code>
            <Badge color="amber">Auth required</Badge>
          </div>

          <H3>Request body</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="peerId" type="string (UUID)" required>UUID of the peer to query. Must belong to your workspace.</Param>
            <Param name="question" type="string" required>Natural language question about the peer. Max 500 characters.</Param>
            <Param name="keys" type="string[]">Optional array of representation keys to limit the inference to. E.g. <code className="font-mono text-xs">["communication_style", "expertise"]</code>. Omit to use all available representations.</Param>
          </div>

          <H3>Response</H3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2">
            <Param name="answer" type="string">Synthesized, actionable answer based on the peer's psychological profile.</Param>
            <Param name="confidence" type="number">Average confidence score (0–100) of the representations used to generate the answer.</Param>
            <Param name="sourcedFrom" type="string[]">List of representation keys that contributed to the answer (e.g. <code className="font-mono text-xs">["expertise", "communication_style"]</code>).</Param>
            <Param name="peerName" type="string">Display name of the queried peer.</Param>
            <Param name="totalRepresentations" type="number">Total number of representations in the peer's profile (including keys not used for this answer).</Param>
          </div>

          <H3>Valid representation keys</H3>
          <div className="grid grid-cols-2 gap-2 my-4">
            {['communication_style', 'expertise', 'preferences', 'values', 'decision_making',
              'personality_traits', 'goals', 'pain_points', 'technical_level', 'language_style'].map(k => (
              <code key={k} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono">{k}</code>
            ))}
          </div>

          {/* Peers */}
          <H2 id="peers">Peers API</H2>
          <P>Peers represent entities in your system — users, AI agents, or objects. Each peer has an independent profile built from conversation history.</P>

          {[
            { method: 'POST', path: '/api/peers', color: 'blue', label: 'Create peer', body: '{"name": "Alice", "type": "user", "metadata": {}}' },
            { method: 'GET', path: '/api/peers', color: 'green', label: 'List peers', query: '?type=user' },
            { method: 'GET', path: '/api/peers/:id', color: 'green', label: 'Get peer (with representations + sessions)' },
            { method: 'PATCH', path: '/api/peers/:id', color: 'amber', label: 'Update peer', body: '{"name": "Alice Smith"}' },
            { method: 'DELETE', path: '/api/peers/:id', color: 'red', label: 'Delete peer (cascade)' },
          ].map(r => (
            <div key={r.path + r.method} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
              <Badge color={r.color as string}>{r.method}</Badge>
              <div>
                <code className="font-mono text-sm text-slate-700">{r.path}{r.query || ''}</code>
                <p className="text-xs text-slate-500 mt-0.5">{r.label}</p>
              </div>
            </div>
          ))}

          {/* Sessions */}
          <H2 id="sessions">Sessions API</H2>
          <P>Sessions are conversation threads tied to peers. One peer can have many sessions. Each session maintains its own message history, summaries, and context.</P>

          {[
            { method: 'POST', path: '/api/sessions', color: 'blue', label: 'Create session', body: '{"peerId": "uuid", "name": "Support #1"}' },
            { method: 'GET', path: '/api/sessions', color: 'green', label: 'List sessions', query: '?peerId=uuid&isActive=true' },
            { method: 'GET', path: '/api/sessions/:id', color: 'green', label: 'Get session (with messages + summaries)' },
            { method: 'PATCH', path: '/api/sessions/:id', color: 'amber', label: 'Update session (name, isActive, metadata)' },
            { method: 'DELETE', path: '/api/sessions/:id', color: 'red', label: 'Delete session (cascade)' },
          ].map(r => (
            <div key={r.path + r.method} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
              <Badge color={r.color as string}>{r.method}</Badge>
              <div>
                <code className="font-mono text-sm text-slate-700">{r.path}{r.query || ''}</code>
                <p className="text-xs text-slate-500 mt-0.5">{r.label}</p>
              </div>
            </div>
          ))}

          {/* Python SDK */}
          <H2 id="sdk-python">Python SDK</H2>
          <P>Copy <code className="font-mono text-sm text-blue-600 bg-blue-50 px-1 rounded">sdk/python/contextmind.py</code> into your project. Only dependency: <code className="font-mono text-xs">requests</code>.</P>
          <Code lang="bash" code="pip install requests" />
          <Code lang="python" code={`from contextmind import ContextMind

cm = ContextMind(
    api_key="ctxmind_your_key",
    base_url="https://your-app.com"
)

# Full workflow
peer = cm.peers.create(name="Alice", type="user")
session = cm.sessions.create(peer_id=peer["id"])

result = cm.ingest(
    session_id=session["id"],
    messages=[
        {"role": "user", "content": "I prefer concise answers with code examples"},
        {"role": "assistant", "content": "Got it. I'll keep responses brief and code-first."},
    ],
    reasoning_level="medium"
)
print(f"Cost: \${result['cost']:.8f}")

# Before every LLM call:
ctx = cm.context(session_id=session["id"], max_tokens=8000)
print(f"Token savings: {ctx.savings_percent}%")

# Pass to OpenAI:
messages = ctx.to_openai_messages("You are a helpful assistant.")
# openai.chat.completions.create(model="gpt-4o", messages=[*messages, user_msg])

# Query the peer's profile:
insight = cm.infer(
    peer_id=peer["id"],
    question="What communication style does this user prefer?"
)
print(insight.answer)  # "Alice prefers short, code-first responses..."
print(f"Confidence: {insight.confidence}%")`} />

          {/* JS SDK */}
          <H2 id="sdk-js">JavaScript SDK</H2>
          <P>Copy <code className="font-mono text-sm text-blue-600 bg-blue-50 px-1 rounded">sdk/javascript/contextmind.js</code> into your project. Zero dependencies — uses native fetch (Node.js 18+, browsers).</P>
          <Code lang="javascript" code={`import { ContextMind } from './contextmind.js'

const cm = new ContextMind({ apiKey: 'ctxmind_your_key', baseUrl: 'https://your-app.com' })

// Full workflow
const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
const session = await cm.sessions.create({ peerId: peer.id, name: 'Chat #1' })

const result = await cm.ingest({
  sessionId: session.id,
  messages: [
    { role: 'user', content: 'I need help with my React app performance' },
    { role: 'assistant', content: 'Sure! What symptoms are you seeing?' },
  ],
  reasoningLevel: 'medium',
})
console.log(\`Cost: \$\${result.cost.toFixed(8)}\`)

// Before every LLM call:
const ctx = await cm.context({ sessionId: session.id, maxTokens: 8000 })
console.log(\`Savings: \${ctx.savingsPercent}%\`)

// Pass to OpenAI:
const messages = ctx.toOpenAIMessages('You are a helpful assistant.')
// await openai.chat.completions.create({ model: 'gpt-4o', messages: [...messages, userMsg] })

// Query peer profile:
const insight = await cm.infer({
  peerId: peer.id,
  question: 'How technically sophisticated is this user?',
})
console.log(insight.answer)
console.log(\`Confidence: \${insight.confidence}%\`)`} />

          {/* TS SDK */}
          <H2 id="sdk-ts">TypeScript SDK</H2>
          <P>Copy <code className="font-mono text-sm text-blue-600 bg-blue-50 px-1 rounded">sdk/typescript/contextmind.ts</code>. Fully typed — all request/response types exported. Zero dependencies.</P>
          <Code lang="typescript" code={`import { ContextMind, type IngestMessage, type ReasoningLevel } from './contextmind'

const cm = new ContextMind({
  apiKey: 'ctxmind_your_key',
  baseUrl: 'https://your-app.com',
})

// Types are fully inferred
const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
const session = await cm.sessions.create({ peerId: peer.id })

const messages: IngestMessage[] = [
  { role: 'user', content: 'Can you review my TypeScript service?' },
  { role: 'assistant', content: 'Happy to. Share the code.' },
]

const result = await cm.ingest({
  sessionId: session.id,
  messages,
  reasoningLevel: 'high' satisfies ReasoningLevel,
})

// ContextResponse is fully typed
const ctx = await cm.context({ sessionId: session.id })
// ctx.recentMessages: Message[]
// ctx.summary: string | null
// ctx.compressionRatio: number
// ctx.savingsPercent: number (computed property)

const openAIMessages = ctx.toOpenAIMessages('You are a TypeScript expert.')

// InferResponse is fully typed
const insight = await cm.infer({
  peerId: peer.id,
  question: 'Does this user prefer explanations or direct code?',
  keys: ['communication_style', 'expertise'],
})
// insight.answer: string
// insight.confidence: number
// insight.sourcedFrom: string[]`} />

          {/* React SDK */}
          <H2 id="sdk-react">React SDK</H2>
          <P>Copy <code className="font-mono text-sm text-blue-600 bg-blue-50 px-1 rounded">sdk/react/contextmind-react.tsx</code>. Provides hooks for context, ingest, infer, and session management with built-in loading/error states.</P>

          <H3>Setup — wrap your app</H3>
          <Code lang="tsx" code={`// app/layout.tsx (Next.js App Router)
import { ContextMindProvider } from '@/sdk/react/contextmind-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContextMindProvider apiKey={process.env.NEXT_PUBLIC_CM_API_KEY!}>
      {children}
    </ContextMindProvider>
  )
}`} />

          <H3>useContextMind — fetch context</H3>
          <Code lang="tsx" code={`import { useContextMind } from '@/sdk/react/contextmind-react'

function ChatSidebar({ sessionId }: { sessionId: string }) {
  const { context, loading, error, refetch } = useContextMind(sessionId, {
    maxTokens: 8000,
    refetchInterval: 5000, // auto-refresh every 5s
  })

  if (loading) return <div>Loading context...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <div>Tokens used: {context?.totalTokens}</div>
      <div>Token savings: {context?.savingsPercent}%</div>
      <div>Summary: {context?.summary}</div>
      {context?.representations.map(rep => (
        <div key={rep.key}>
          <strong>{rep.key}:</strong> {rep.value} ({rep.confidence}%)
        </div>
      ))}
    </div>
  )
}`} />

          <H3>useIngest — send messages</H3>
          <Code lang="tsx" code={`import { useIngest } from '@/sdk/react/contextmind-react'

function ChatInput({ sessionId, onSent }: { sessionId: string; onSent: () => void }) {
  const { ingest, loading, result } = useIngest()
  const [input, setInput] = useState('')

  const send = async () => {
    await ingest(sessionId, [
      { role: 'user', content: input },
    ], 'medium')
    setInput('')
    onSent() // trigger context refetch
  }

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={send} disabled={loading}>
        {loading ? 'Sending…' : 'Send'}
      </button>
      {result && <div>Cost: \${result.cost.toFixed(8)} · Tokens: {result.tokensIngested}</div>}
    </div>
  )
}`} />

          <H3>useInfer — query peer profile</H3>
          <Code lang="tsx" code={`import { useInfer } from '@/sdk/react/contextmind-react'

function PersonalisedGreeting({ peerId }: { peerId: string }) {
  const { infer, result, loading } = useInfer(peerId)

  useEffect(() => {
    infer('What tone and communication style does this user prefer?')
  }, [peerId])

  if (loading) return <span>Analysing profile…</span>
  if (!result) return null

  return (
    <div>
      <p>{result.answer}</p>
      <small>Confidence: {result.confidence}% · Based on: {result.sourcedFrom.join(', ')}</small>
    </div>
  )
}`} />

          {/* Reasoning Levels */}
          <H2 id="reasoning">Reasoning Levels</H2>
          <P>The <code className="font-mono text-sm text-blue-600 bg-blue-50 px-1 rounded">reasoningLevel</code> parameter controls how aggressively ContextMind extracts Theory of Mind insights during ingest. Higher levels produce richer profiles but require more evidence before committing to an insight.</P>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Level', 'Confidence Threshold', 'What it extracts', 'Best for'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { level: 'minimal', threshold: '90%', extracts: 'Name, location, explicit facts only', use: 'High-volume pipelines, cost-sensitive apps' },
                  { level: 'low', threshold: '80%', extracts: 'Standard recall, stated preferences', use: 'Basic personalisation' },
                  { level: 'medium', threshold: '70%', extracts: 'Balanced: style, expertise, preferences', use: 'Most production apps (recommended default)' },
                  { level: 'high', threshold: '60%', extracts: 'Complex insights: motivations, decision patterns', use: 'Customer success, coaching apps' },
                  { level: 'max', threshold: '50%', extracts: 'Deep profiling: values, biases, cognitive patterns', use: 'Therapy, HR, relationship intelligence' },
                ].map(r => (
                  <tr key={r.level} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><code className="font-mono text-blue-600 text-xs">{r.level}</code></td>
                    <td className="px-4 py-3 text-slate-700">{r.threshold}</td>
                    <td className="px-4 py-3 text-slate-600">{r.extracts}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Errors */}
          <H2 id="errors">Error Handling</H2>
          <P>All API errors return a JSON object with <code className="font-mono text-xs text-blue-600">error</code> (message) and optionally <code className="font-mono text-xs text-blue-600">hint</code> (actionable suggestion).</P>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Status', 'Error', 'Cause', 'Fix'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { status: '401', error: 'Missing x-api-key header', cause: 'No API key in request', fix: 'Add x-api-key header' },
                  { status: '401', error: 'Invalid API key', cause: 'Key not found or revoked', fix: 'Check dashboard for valid key' },
                  { status: '400', error: 'Validation error', cause: 'Invalid request body', fix: 'Check details field in response' },
                  { status: '404', error: 'Session not found', cause: 'sessionId does not exist or wrong workspace', fix: 'Verify sessionId belongs to this workspace' },
                  { status: '404', error: 'Peer not found', cause: 'peerId does not exist or wrong workspace', fix: 'Verify peerId belongs to this workspace' },
                  { status: '500', error: 'Internal server error', cause: 'Upstream LLM or DB error', fix: 'Retry with exponential backoff' },
                ].map(r => (
                  <tr key={r.error} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Badge color={r.status === '401' || r.status === '403' ? 'red' : r.status === '400' ? 'amber' : r.status === '404' ? 'purple' : 'slate'}>{r.status}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.error}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{r.cause}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Code lang="typescript" code={`// Recommended error handling pattern:
try {
  const ctx = await cm.context({ sessionId })
} catch (err) {
  if (err instanceof AuthError) {
    // Redirect to dashboard to get a new key
    console.error('Invalid API key')
  } else if (err instanceof NotFoundError) {
    // Session was deleted or wrong workspace
    console.error('Session not found — create a new one')
  } else if (err instanceof ValidationError) {
    // Bad request params
    console.error('Validation error:', err.message)
  } else {
    // 500 — retry with backoff
    await sleep(1000)
    retry()
  }
}`} />

          <div className="mt-12 mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">Need help?</h3>
            <p className="text-blue-700 text-sm">Found a bug or need a feature? Open an issue on GitHub or reach out via the dashboard.</p>
          </div>

        </main>
      </div>
    </div>
  )
}
