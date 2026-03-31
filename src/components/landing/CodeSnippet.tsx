'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const codeLines = [
  'await contextmind.ingest(sessionId, messages);',
  '',
  'const ctx = await contextmind.getContext(sessionId);',
  '',
  'const response = llm.generate(ctx);'
]

export const CodeSnippet = () => {
  const [currentLine, setCurrentLine] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const [tokens, setTokens] = useState(4200)

  useEffect(() => {
    if (currentLine < codeLines.length) {
      if (charIndex < codeLines[currentLine].length) {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + codeLines[currentLine][charIndex])
          setCharIndex((prev) => prev + 1)
        }, 30)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + '\n')
          setCurrentLine((prev) => prev + 1)
          setCharIndex(0)
          
          if (currentLine === 0) setTokens(380)
        }, 500)
        return () => clearTimeout(timeout)
      }
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine(0)
        setDisplayText('')
        setCharIndex(0)
        setTokens(4200)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [currentLine, charIndex])

  return (
    <div className="relative w-full bg-slate-900 rounded-2xl p-6 shadow-2xl border border-white/10 font-mono text-sm group">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
        <span className="text-slate-500 text-[10px] ml-2 tracking-widest uppercase">contextmind-example.js</span>
      </div>

      <div className="min-h-[140px] text-blue-400">
        <pre className="whitespace-pre-wrap">
          {displayText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-blue-500 ml-1 translate-y-1"
          />
        </pre>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Live SDK Session
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            REST Optimized
          </div>
        </div>
        
        <div className="text-slate-400 text-[10px] font-bold">
            TOKENS: <motion.span 
              animate={{ color: tokens < 1000 ? '#3b82f6' : '#94a3b8' }}
              className="text-white"
            >{tokens}</motion.span>
        </div>
      </div>
    </div>
  )
}
