'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const BinaryRain = () => {
  const [columns, setColumns] = useState<number[]>([])

  useEffect(() => {
    setColumns(Array.from({ length: 20 }, (_, i) => i))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] select-none">
      <div className="flex justify-around w-full h-full">
        {columns.map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100 }}
            animate={{ y: '100vh' }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 20,
            }}
            className="flex flex-col text-xs font-mono leading-none"
          >
            {Array.from({ length: 50 }).map((_, j) => (
              <span key={j}>{Math.round(Math.random())}</span>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
