'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  title: string
  desc: string
  icon: LucideIcon
  index: number
}

export const FeatureCard = ({ title, desc, icon: Icon, index }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white border border-slate-200 p-8 rounded-3xl hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden cursor-default"
    >
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-blue-100/50">
          <Icon size={24} strokeWidth={2.5} />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-700 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
        
        <div className="mt-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Learn More</div>
            <div className="w-4 h-[1px] bg-blue-600" />
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-200 group-hover:text-blue-100 transition-colors">
        0{index + 1}
      </div>
    </motion.div>
  )
}
