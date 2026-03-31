'use client'
import React, { useEffect, useState, useRef } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { AlertTriangle, TrendingUp, ZapOff } from 'lucide-react'

// Particle effect for "exploding costs"
const Particles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full border border-red-500/50 bg-red-500/20"
          initial={{ 
            opacity: 0, 
            right: 0, 
            top: "20%" 
          }}
          animate={{
            opacity: [0, 1, 0],
            right: `${-10 - Math.random() * 20}%`,
            top: `${-20 + Math.random() * 40}%`,
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: 2 + Math.random() * 2,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

export const ProblemGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.5 })
  const [tokens, setTokens] = useState(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(1000, 128000, {
        duration: 2.5,
        ease: "easeIn",
        onUpdate: (val) => setTokens(Math.round(val))
      })
      return controls.stop
    }
  }, [isInView])

  return (
    <div ref={containerRef} className="relative w-full aspect-square md:aspect-video rounded-[2.5rem] border border-red-100 bg-gradient-to-br from-white to-red-50/50 overflow-hidden shadow-2xl shadow-red-500/5">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      
      {/* Background Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-400/20 blur-[100px] rounded-full" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-400/10 blur-[80px] rounded-full" />

      {isInView && <Particles />}

      <div className="relative h-full w-full flex flex-col p-8 lg:p-10">
        
        {/* Header Stats */}
        <div className="flex justify-between items-start mb-6 z-10">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Tokens Per Request</span>
            <span className="text-4xl md:text-5xl lg:text-6xl font-black text-rose-500 font-mono tracking-tighter flex items-center gap-3">
              {tokens.toLocaleString()}
              {isInView && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: 1, type: "spring" }}
                  className="bg-rose-100 p-2 rounded-xl border border-rose-200"
                >
                  <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-rose-600" strokeWidth={3}/>
                </motion.div>
              )}
            </span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.5, type: 'spring' }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 border border-rose-400"
          >
            <AlertTriangle size={16} className="animate-pulse" />
            <span className="hidden sm:inline">Critical Cost Level</span>
            <span className="sm:hidden">Alert</span>
          </motion.div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 relative mt-2 border-l-2 border-b-2 border-slate-200/80 rounded-bl-2xl pl-4 pb-4">
          {/* Axis Labels */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold whitespace-nowrap">Cost ($)</div>
          <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold whitespace-nowrap">Context Window</div>

          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Defs for gradients */}
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[20, 40, 60, 80].map(val => (
                <line key={`h-${val}`} x1={0} y1={val} x2={100} y2={val} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 4" />
            ))}
            {[20, 40, 60, 80].map(val => (
                <line key={`v-${val}`} x1={val} y1={0} x2={val} y2={100} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 4" />
            ))}

            {/* Area under the red curve */}
            <motion.path
                d="M 0 100 Q 40 98, 70 80 T 100 0 L 100 100 Z"
                fill="url(#area-gradient)"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Ideal Line (Blueish) */}
            <motion.path
                d="M 0 100 L 100 80"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            
            {/* Real Cost Line (Exponential Red) */}
            <motion.path
              d="M 0 100 Q 40 98, 70 80 T 100 0"
              fill="none"
              stroke="#e11d48"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 2.5, ease: 'easeIn' }}
            />

            {/* Pulsing dot at the end of Real Cost */}
            {isInView && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
              >
                  <circle cx="100" cy="0" r="14" fill="#e11d48" opacity="0.3">
                    <animate attributeName="r" values="14; 28; 14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3; 0; 0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="100" cy="0" r="6" fill="#e11d48" />
              </motion.g>
            )}
            
            {/* The gap area highlight text */}
            {isInView && (
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.8 }}
                className="pointer-events-none"
              >
                  <line x1="100" y1="80" x2="100" y2="0" stroke="#e11d48" strokeWidth="1" strokeDasharray="2 4"/>
              </motion.g>
            )}
          </svg>

          {/* Labels superimposed on Graph */}
          {isInView && (
             <motion.div
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1 }}
               className="absolute left-8 bottom-16 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200/80 text-[10px] md:text-xs font-bold text-slate-500 shadow-sm"
             >
               Linear Cost
             </motion.div>
          )}

          {isInView && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.2, type: 'spring' }}
              className="absolute right-4 top-16 md:right-12 xl:right-16 bg-red-50/90 backdrop-blur-md text-red-600 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black tracking-wide shadow-xl shadow-red-500/10 border border-red-200 flex items-center gap-2 z-10"
            >
              <ZapOff size={14} className="text-red-500"/> Repeated Context
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
