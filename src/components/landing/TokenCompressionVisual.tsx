'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const chatMessages = [
  { role: 'user', text: 'I prefer bullet points, not paragraphs' },
  { role: 'ai', text: 'Got it — keeping it concise.' },
  { role: 'user', text: 'I am a senior Python engineer on ML pipelines' },
  { role: 'ai', text: 'Understood. I\'ll skip the basics.' },
  { role: 'user', text: 'Can you review my data preprocessing code?' },
  { role: 'ai', text: 'Sure, share the snippet and I\'ll optimize it.' },
]

const compressedInsights = [
  { key: 'communication_style', value: 'Prefers bullet points', confidence: 92 },
  { key: 'expertise', value: 'Senior Python / ML', confidence: 88 },
  { key: 'preferences', value: 'Direct, code-first answers', confidence: 85 },
]

export const TokenCompressionVisual = () => {
  const [stage, setStage] = useState(0)
  const [tokens, setTokens] = useState(8240)

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((s) => (s + 1) % 3)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (stage === 2) {
      const interval = setInterval(() => {
        setTokens((t) => (t > 743 ? Math.floor(t - (t - 743) / 8) : 743))
      }, 40)
      return () => clearInterval(interval)
    } else {
      setTokens(8240)
    }
  }, [stage])

  const stageLabels = ['Ingesting Messages', 'Compressing Context', 'Optimized Output']

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          contextmind — live demo
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                stage === i ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stage label */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            stage === 0 ? 'bg-blue-500' : stage === 1 ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {stageLabels[stage]}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="h-[320px] px-5 pb-5 relative">
        <AnimatePresence mode="wait">
          {/* Stage 0: Chat messages streaming in */}
          {stage === 0 && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 pt-2"
            >
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.4 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-medium ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white/10 text-slate-300 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-right"
              >
                <span className="text-[10px] font-mono text-slate-600">
                  {'{'}8,240 tokens — $0.016{'}'}
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* Stage 1: Compression animation */}
          {stage === 1 && (
            <motion.div
              key="compress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-6"
            >
              {/* Shrinking blocks */}
              <div className="flex items-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 40, height: 60, opacity: 1 }}
                    animate={{
                      width: [40, 40, 12],
                      height: [60, 60, 12],
                      opacity: [1, 1, 0.4],
                      borderRadius: ['12px', '12px', '50%'],
                    }}
                    transition={{ duration: 2, delay: i * 0.15, ease: 'easeInOut' }}
                    className="bg-blue-500/30 border border-blue-500/20 flex items-center justify-center"
                  >
                    <motion.span
                      initial={{ opacity: 1 }}
                      animate={{ opacity: [1, 1, 0] }}
                      transition={{ duration: 1.5, delay: i * 0.15 }}
                      className="text-[8px] font-mono text-blue-400"
                    >
                      msg
                    </motion.span>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2, type: 'spring', stiffness: 100 }}
                  className="text-xl text-slate-600 mx-2"
                >
                  →
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.3, type: 'spring', stiffness: 80 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20"
                >
                  <span className="text-white text-[10px] font-black">CTX</span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8 }}
                className="flex items-center gap-4"
              >
                <div className="h-px w-12 bg-slate-800" />
                <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest">summarizing + extracting</span>
                <div className="h-px w-12 bg-slate-800" />
              </motion.div>
            </motion.div>
          )}

          {/* Stage 2: Compressed output */}
          {stage === 2 && (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col pt-2"
            >
              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
              >
                <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-2">Summary</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Alice is a senior Python/ML engineer who prefers concise, bullet-point answers with code examples. Skip basics, be direct.
                </p>
              </motion.div>

              {/* Insights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4"
              >
                <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-3">Theory of Mind</div>
                <div className="space-y-2">
                  {compressedInsights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.2 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <span className="text-[10px] font-mono text-slate-500">{insight.key}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">{insight.value}</span>
                        <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{insight.confidence}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Token counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-white tracking-tighter">{tokens}</div>
                  <span className="text-[10px] text-slate-500 font-mono">tokens</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400">91% saved</div>
                  <div className="text-[9px] font-mono text-slate-600">8,240 → 743</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
