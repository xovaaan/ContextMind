'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const ComparisonSection = () => {
  const [tokensBefore, setTokensBefore] = useState(8240)
  const [tokensAfter, setTokensAfter] = useState(743)
  const [isOptimized, setIsOptimized] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsOptimized((prev) => !prev)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isOptimized) {
      setTokensBefore(8240)
      setTokensAfter(743)
    } else {
      setTokensBefore(0)
      setTokensAfter(0)
    }
  }, [isOptimized])

  return (
    <div className="grid md:grid-cols-2 gap-8 items-stretch pt-12">
      {/* Before */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-red-100 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <div className="text-8xl font-black text-red-600 tracking-tighter">EXCESS</div>
        </div>
        <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 px-3 py-1 bg-red-50 rounded-full">Without ContextMind</div>
        <div className="text-6xl font-black text-slate-900 tracking-tighter mb-2">
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                8,240
            </motion.span>
        </div>
        <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Tokens / Interaction</div>
        <div className="mt-8 space-y-2 w-full max-w-[200px]">
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-red-100 rounded-full w-4/5 mx-auto opacity-50" />
        </div>
        <div className="mt-12 pt-6 border-t border-slate-100 w-full text-center">
            <div className="text-sm text-slate-400">Estimated Cost: <span className="text-slate-900 font-bold">$0.016</span></div>
        </div>
      </div>

      {/* After */}
      <div className="bg-blue-600 border border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden text-white group shadow-2xl shadow-blue-600/20">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-10" />
        <div className="relative z-10 flex flex-col items-center w-full">
            <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-6 px-3 py-1 bg-blue-500/50 rounded-full border border-blue-400/30">With ContextMind</div>
            <div className="text-6xl font-extrabold tracking-tighter mb-2 flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={isOptimized ? 'opt' : 'raw'}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                    >
                        {isOptimized ? '743' : '8,240'}
                    </motion.span>
                </AnimatePresence>
                <span className="text-xl font-medium text-blue-300">tokens</span>
            </div>
            <div className="text-sm font-medium text-blue-200 uppercase tracking-widest">Optimized Context</div>
            
            <div className="mt-8 relative w-full h-32 bg-white/10 rounded-xl border border-white/20 p-4 font-mono text-[10px] text-blue-100 overflow-hidden group-hover:bg-white/20 transition-all">
                <div className="flex items-center gap-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    &quot;summary&quot;: &quot;Compressed...&quot;
                </div>
                &quot;representations&quot;: [...]<br />
                &quot;recentMessages&quot;: [...]<br />
                &quot;compressionRatio&quot;: 0.09
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 w-full text-center">
                <div className="text-4xl font-black text-white">91% <span className="text-lg font-bold text-blue-200 uppercase tracking-tighter">SAVINGS</span></div>
                <div className="mt-2 text-[10px] text-blue-200 uppercase tracking-widest font-bold opacity-60">Verified Production Benchmarks</div>
            </div>
        </div>
      </div>
    </div>
  )
}
