'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Workspace { id: string; name: string; plan: string; usageTokens: number; apiKey: string }
interface Peer { id: string; name: string; type: string; metadata: Record<string, unknown>; createdAt: string }
interface Session { id: string; name: string | null; isActive: boolean; messageCount: number; updatedAt: string }

type Tab = 'peers' | 'sessions' | 'api'

const PEER_TYPE_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  agent: 'bg-purple-100 text-purple-700',
  object: 'bg-amber-100 text-amber-700',
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [ws, setWs] = useState<Workspace | null>(null)
  const [peers, setPeers] = useState<Peer[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [tab, setTab] = useState<Tab>('peers')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Modals
  const [showPeerModal, setShowPeerModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [peerName, setPeerName] = useState('')
  const [peerType, setPeerType] = useState<'user' | 'agent' | 'object'>('user')
  const [sessionName, setSessionName] = useState('')
  const [sessionPeerId, setSessionPeerId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // We need to get workspace by hitting workspaces list
  useEffect(() => {
    Promise.all([
      fetch('/api/workspaces').then(r => r.json()),
    ]).then(([wsList]) => {
      const found = wsList.find((w: Workspace) => w.id === id)
      if (found) {
        setWs(found)
        return fetch(`/api/peers`, { headers: { 'x-api-key': found.apiKey } })
          .then(r => r.json())
          .then(p => { setPeers(p); return fetch(`/api/sessions`, { headers: { 'x-api-key': found.apiKey } }) })
          .then(r => r.json())
          .then(s => setSessions(s))
      }
    }).finally(() => setLoading(false))
  }, [id])

  const copyKey = () => {
    if (ws) { navigator.clipboard.writeText(ws.apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const createPeer = async () => {
    if (!ws || !peerName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ws.apiKey },
        body: JSON.stringify({ name: peerName.trim(), type: peerType }),
      })
      if (res.ok) { setPeers(p => [...p, await res.json()]); setShowPeerModal(false); setPeerName('') }
    } finally { setSubmitting(false) }
  }

  const createSession = async () => {
    if (!ws || !sessionPeerId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ws.apiKey },
        body: JSON.stringify({ peerId: sessionPeerId, name: sessionName || undefined }),
      })
      if (res.ok) { setSessions(s => [...s, await res.json()]); setShowSessionModal(false); setSessionName(''); setSessionPeerId('') }
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
  if (!ws) return <div className="p-8 text-slate-500">Workspace not found.</div>

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900 transition mb-6 inline-flex items-center gap-1">
        ← Back to Workspaces
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{ws.name}</h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full uppercase tracking-wider font-medium">{ws.plan}</span>
          </div>
          <p className="text-slate-500 mt-1">{(ws.usageTokens / 1_000_000).toFixed(4)}M tokens · ${(ws.usageTokens * 0.000002).toFixed(6)} cost</p>
        </div>
      </div>

      {/* API Key card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-8 text-white">
        <div className="text-xs font-semibold uppercase tracking-widest mb-2 text-blue-200">API Key</div>
        <div className="flex items-center gap-3">
          <code className="flex-1 font-mono text-sm bg-blue-800/50 rounded-lg px-3 py-2 truncate">{ws.apiKey}</code>
          <button onClick={copyKey} className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-blue-200 text-xs mt-2">Use this key in the <code className="font-mono">x-api-key</code> header for all API calls.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {(['peers', 'sessions', 'api'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            {t === 'peers' ? `Peers (${peers.length})` : t === 'sessions' ? `Sessions (${sessions.length})` : 'API Docs'}
          </button>
        ))}
      </div>

      {/* Peers tab */}
      {tab === 'peers' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowPeerModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2">
              + New Peer
            </button>
          </div>
          {peers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-slate-500">No peers yet. Create your first user, agent, or object.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-slate-50">
                  {['Name', 'Type', 'Created'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {peers.map(peer => (
                    <tr key={peer.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{peer.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${PEER_TYPE_COLORS[peer.type] || 'bg-slate-100 text-slate-600'}`}>
                          {peer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(peer.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowSessionModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
              disabled={peers.length === 0}>
              + New Session
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-slate-500">No sessions yet. {peers.length === 0 ? 'Create a peer first.' : 'Create a session to start ingesting messages.'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-slate-50">
                  {['Name', 'Messages', 'Status', 'Updated'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {sessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{s.name || 'Unnamed session'}</div>
                        <div className="text-xs text-slate-400 font-mono">{s.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{s.messageCount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {s.isActive ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* API tab */}
      {tab === 'api' && (
        <div className="space-y-6">
          {[
            {
              title: 'POST /api/ingest — Ingest messages',
              code: `curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/ingest \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${ws.apiKey}" \\
  -d '{
    "sessionId": "YOUR_SESSION_UUID",
    "messages": [
      {"role": "user", "content": "Hello, I need help with my order"},
      {"role": "assistant", "content": "Sure! What is your order number?"}
    ],
    "reasoningLevel": "medium"
  }'`,
            },
            {
              title: 'GET /api/context — Retrieve compressed context',
              code: `curl "${typeof window !== 'undefined' ? window.location.origin : ''}/api/context?sessionId=YOUR_SESSION_UUID&maxTokens=8000" \\
  -H "x-api-key: ${ws.apiKey}"`,
            },
            {
              title: 'POST /api/infer — Query peer profile (Theory of Mind)',
              code: `curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/infer \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${ws.apiKey}" \\
  -d '{
    "peerId": "YOUR_PEER_ID",
    "question": "What is this user\\'s preferred communication style?"
  }'`,
            },
          ].map(({ title, code }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
              </div>
              <pre className="p-5 text-xs text-slate-700 font-mono overflow-x-auto leading-relaxed bg-slate-950 text-green-300">{code}</pre>
            </div>
          ))}
        </div>
      )}

      {/* New Peer Modal */}
      {showPeerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-5">New Peer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input type="text" value={peerName} onChange={e => setPeerName(e.target.value)} placeholder="e.g. Alice"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select value={peerType} onChange={e => setPeerType(e.target.value as typeof peerType)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="object">Object</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowPeerModal(false); setPeerName('') }} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button onClick={createPeer} disabled={submitting || !peerName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold transition">
                {submitting ? 'Creating…' : 'Create Peer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-5">New Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Name (optional)</label>
                <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="e.g. Support ticket #1234"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Peer</label>
                <select value={sessionPeerId} onChange={e => setSessionPeerId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
                  <option value="">Select a peer…</option>
                  {peers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowSessionModal(false); setSessionName(''); setSessionPeerId('') }} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button onClick={createSession} disabled={submitting || !sessionPeerId}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold transition">
                {submitting ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
