'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  plan: string
  usageTokens: number
  apiKey: string
  createdAt: string
}

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      if (res.ok) setWorkspaces(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkspaces() }, [])

  const createWorkspace = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const ws = await res.json()
        setWorkspaces(prev => [...prev, ws])
        setShowModal(false)
        setNewName('')
      } else {
        const err = await res.json()
        alert(`Failed to create workspace: ${err.details || err.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const maskKey = (key: string) => `${key.slice(0, 16)}${'•'.repeat(20)}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Workspaces</h1>
          <p className="text-slate-500 mt-1">Manage your API workspaces and keys</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition transform hover:scale-105 flex items-center gap-2">
          <span className="text-lg">+</span> New Workspace
        </button>
      </div>

      {/* Empty state */}
      {workspaces.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">🏗️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No workspaces yet</h2>
          <p className="text-slate-500 mb-6">Create your first workspace to get an API key and start ingesting conversations.</p>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition">
            Create Workspace
          </button>
        </div>
      )}

      {/* Workspace grid */}
      <div className="grid gap-6">
        {workspaces.map(ws => (
          <div key={ws.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{ws.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full uppercase tracking-wider font-medium">{ws.plan}</span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-slate-500">
                  <span>{(ws.usageTokens / 1_000_000).toFixed(4)}M tokens used</span>
                  <span>·</span>
                  <span>${(ws.usageTokens * 0.000002).toFixed(6)} cost</span>
                </div>
              </div>
              <Link href={`/dashboard/workspaces/${ws.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                Manage →
              </Link>
            </div>

            {/* API Key */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider shrink-0">API Key</span>
              <code className="flex-1 font-mono text-sm text-slate-700 truncate">{maskKey(ws.apiKey)}</code>
              <button onClick={() => copyKey(ws.id, ws.apiKey)}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-lg transition font-medium">
                {copiedId === ws.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-1">New Workspace</h2>
            <p className="text-slate-500 text-sm mb-5">A workspace groups your API keys, peers, and sessions.</p>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace Name</label>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createWorkspace()}
              placeholder="e.g. My AI App" autoFocus
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 mb-5"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowModal(false); setNewName('') }}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition">Cancel</button>
              <button onClick={createWorkspace} disabled={creating || !newName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold transition">
                {creating ? 'Creating…' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
