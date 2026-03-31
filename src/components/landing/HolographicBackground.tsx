'use client'
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export const HolographicBackground = () => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Generate scattered points only once on the client
  const bits = useMemo(() => {
    if (!mounted) return []
    return Array.from({ length: 300 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      value: Math.round(Math.random()),
      size: Math.random() * 10 + 8, // 8px to 18px
      duration: Math.random() * 3 + 2, // 2s to 5s
      delay: Math.random() * 10,
    }))
  }, [mounted])

  if (!mounted) return <div className="fixed inset-0 bg-black" /> // Simple base background while hydrating

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[5]">
      {bits.map((bit) => (
        <motion.div
          key={bit.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{
            duration: bit.duration,
            repeat: Infinity,
            delay: bit.delay,
            ease: "easeInOut"
          }}
          className="absolute font-mono text-emerald-500/30 font-black"
          style={{
            left: `${bit.x}%`,
            top: `${bit.y}%`,
            fontSize: `${bit.size}px`,
            textShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
          }}
        >
          {bit.value}
        </motion.div>
      ))}
    </div>
  )
}
