'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Workspace {
  id: string
  name: string
  plan: string
  usageTokens: number
}

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function UsagePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setWorkspaces(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalTokens = Array.isArray(workspaces) 
    ? workspaces.reduce((s, w) => s + (w.usageTokens || 0), 0) 
    : 0
  const totalCost = totalTokens * 0.000002

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="p-8 max-w-7xl mx-auto space-y-12"
    >
      {/* Header */}
      <motion.div variants={itemVars} className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Usage & <span className="text-blue-600">Billing</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Track your token usage and estimated costs in real-time</p>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: 'Total Tokens Ingested', 
            value: totalTokens.toLocaleString(), 
            sub: 'Across all workspaces', 
            grad: 'from-blue-500/10 to-indigo-500/10',
            text: 'text-blue-600'
          },
          { 
            label: 'Estimated Cost', 
            value: `$${totalCost.toFixed(6)}`, 
            sub: '$2.00 per million tokens', 
            grad: 'from-emerald-500/10 to-teal-500/10',
            text: 'text-emerald-600'
          },
          { 
            label: 'Active Workspaces', 
            value: workspaces.length.toString(), 
            sub: 'Running live environments', 
            grad: 'from-purple-500/10 to-fuchsia-500/10',
            text: 'text-purple-600'
          },
        ].map(card => (
          <div key={card.label} className={`glass relative overflow-hidden group p-8 rounded-3xl transition-all hover:scale-[1.02] hover:shadow-2xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.grad} pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity`} />
            <div className="relative z-10">
              <div className={`text-4xl font-black ${card.text} mb-2 tracking-tighter`}>{card.value}</div>
              <div className="text-sm font-bold text-slate-800 uppercase tracking-widest">{card.label}</div>
              <div className="text-xs text-slate-500 font-medium mt-1 uppercase opacity-70 italic">{card.sub}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Pricing insight */}
      <motion.div variants={itemVars} className="glass p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-500/20">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="shrink-0">
            <div className="text-5xl mb-4">💎</div>
            <h2 className="text-3xl font-black tracking-tight leading-none uppercase">Premium<br/>Pricing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-1 w-12 bg-white/20 rounded-full" />
              <div className="text-lg font-bold">Standard Ingestion</div>
              <p className="text-sm text-blue-100 font-medium leading-relaxed">Flat rate of $2 per million tokens. No hidden fees or base subscription costs.</p>
            </div>
            <div className="space-y-3">
              <div className="h-1 w-12 bg-white/20 rounded-full" />
              <div className="text-lg font-bold">Free Retrieval</div>
              <p className="text-sm text-blue-100 font-medium leading-relaxed">GET /api/context calls are completely free and unlimited for all users.</p>
            </div>
            <div className="space-y-3">
              <div className="h-1 w-12 bg-white/20 rounded-full" />
              <div className="text-lg font-bold">Massive Savings</div>
              <p className="text-sm text-blue-100 font-medium leading-relaxed">Built-in 90% reduction in token usage compared to traditional context management.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comparison analysis */}
      <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] group-hover:bg-red-600/20 transition-all" />
          <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            WITHOUT CONTEXTMIND
          </h3>
          <div className="space-y-6">
            <div className="text-5xl font-black text-white tracking-tighter">~$20 - $60</div>
            <p className="text-slate-400 font-medium leading-loose">
              Costs multiply exponentially as conversation history grows. You pay for the entire history on every single LLM call.
            </p>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl bg-white relative overflow-hidden group border-2 border-blue-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] group-hover:bg-blue-600/10 transition-all" />
          <h3 className="text-lg font-bold text-blue-600 mb-6 flex items-center gap-2 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            WITH CONTEXTMIND
          </h3>
          <div className="space-y-6">
            <div className="text-5xl font-black text-slate-900 tracking-tighter">~$2 - $8</div>
            <p className="text-slate-500 font-medium leading-loose">
              Intelligent compression and Theory of Mind extraction only ingest what's necessary. Dramatic savings on every interaction.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Table section */}
      {workspaces.length > 0 && (
        <motion.div variants={itemVars} className="glass p-1 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Workspace ID', 'Environment', 'Tokens Used', 'Running Cost'].map(header => (
                    <th key={header} className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspaces.map(ws => (
                  <tr key={ws.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-6 font-mono text-sm text-slate-400 opacity-60">{ws.id.slice(0, 8)}...</td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{ws.name}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">{ws.plan} environment</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xl font-black text-slate-700 tracking-tight">{ws.usageTokens.toLocaleString()}</div>
                      <div className="text-xs font-medium text-slate-400">Tokens Ingested</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-2xl font-black text-emerald-600 tracking-tighter">${(ws.usageTokens * 0.000002).toFixed(6)}</div>
                      <div className="text-xs font-medium text-slate-400 italic">Estimated Total</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
