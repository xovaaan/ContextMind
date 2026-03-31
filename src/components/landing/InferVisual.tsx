'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Brain, Target, Sparkles } from 'lucide-react'

export const InferVisual = () => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % 2), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full aspect-square md:h-[400px] bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-center justify-center p-8 overflow-hidden group">
      <div className="absolute inset-0 bg-grid-slate-100 opacity-20" />
      
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="relative bg-white p-6 rounded-2xl shadow-xl shadow-indigo-200/50 border border-indigo-200 max-w-xs"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <MessageSquare size={16} />
              </div>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Context Query</div>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed italic">
              "What's the best way to respond to this customer based on their history?"
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="output"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="relative bg-slate-900 p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
                <Sparkles className="text-blue-400 opacity-20" size={48} />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Brain size={16} />
              </div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">AI Insight Extracted</div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'TONE', value: 'Professional, Conciseness', icon: Target },
                { label: 'EXPERTISE', value: 'High Technical Knowledge', icon: Sparkles },
                { label: 'PREFERENCE', value: 'Prefers code examples', icon: Target }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                >
                  <item.icon size={14} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</div>
                    <div className="text-[11px] font-medium text-blue-100">{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
