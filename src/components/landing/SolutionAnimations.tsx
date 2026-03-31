'use client'
import React from 'react'
import { motion } from 'framer-motion'

export const IngestAnim = () => (
  <div className="relative w-8 h-8 flex flex-col justify-end items-center overflow-hidden">
    {/* Database bin */}
    <div className="w-7 h-4 border-[2px] border-white/50 rounded-b-xl border-t-0 flex justify-center z-10 bg-slate-900" />
    <div className="absolute bottom-4 w-7 h-1 bg-white/20 rounded-full blur-[1px]"/>
    
    {/* Sequential Falling Data Blocks */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute top-0 w-2 h-2 bg-white rounded-[2px] shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        initial={{ y: -10, opacity: 0 }}
        animate={{ 
          y: [-10, 20, 20], 
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.4,
          repeat: Infinity,
          ease: "easeIn"
        }}
      />
    ))}
  </div>
)

export const CompressAnim = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    {/* Outer compressing data blocks */}
    <motion.div 
      className="w-6 h-6 grid grid-cols-2 gap-[2px] absolute"
      animate={{ scale: [1, 0.2, 1], opacity: [1, 0, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/40 rounded-[2px]" />
      ))}
    </motion.div>
    
    {/* Core synthesized block (Insight) */}
    <motion.div 
      className="w-[10px] h-[10px] bg-white rounded-[2px] shadow-[0_0_12px_rgba(255,255,255,1)] absolute"
      animate={{ scale: [0, 1.2, 0], rotate: [0, 90, 180] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
)

export const RetrieveAnim = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    {/* Scope/Radar outer circle */}
    <motion.div 
      className="absolute w-7 h-7 border-[2px] border-transparent border-t-white/80 border-r-white/40 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
    <div className="absolute w-6 h-6 border-[2px] border-dashed border-white/20 rounded-full" />
    
    {/* Pulsing Target / Insight */}
    <motion.div 
      className="absolute w-2 h-2 bg-white rounded-sm shadow-[0_0_8px_rgba(255,255,255,1)]"
      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  </div>
)
