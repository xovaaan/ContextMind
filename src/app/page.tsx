'use client'
import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Zap, Brain,
  Search, Shield, Cpu, Code2, Users2,
  Layers, Globe, Terminal, Sparkles,
  BarChart3, Minimize2, Database, MessageSquare,
  ChevronDown, Quote
} from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

// Import pre-built components
import { TokenCompressionVisual } from '@/components/landing/TokenCompressionVisual'
import { ProblemGraph } from '@/components/landing/ProblemGraph'
import { CodeSnippet } from '@/components/landing/CodeSnippet'
import { ComparisonSection } from '@/components/landing/ComparisonSection'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { InferVisual } from '@/components/landing/InferVisual'
import { IngestAnim, CompressAnim, RetrieveAnim } from '@/components/landing/SolutionAnimations'

// Native Benchmark Component (Restored & Fixed)
function BenchmarkCharts() {
  const costRef = useRef(null)
  const latRef = useRef(null)

  useEffect(() => {
    let costChart: any = null
    let latChart: any = null
    let isMounted = true

    async function init() {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (!isMounted) return

      // Use safe, loaded fonts to avoid "Wingdings" symbols on Windows
      const tickFont = { family: "'Poppins', sans-serif", size: 11 }
      const tickColor = 'rgba(15, 23, 42, 0.5)' // slate-900 at 50%
      const gridColor = 'rgba(15, 23, 42, 0.05)' // slate-900 at 5%

      if (costRef.current) {
        const existing = Chart.getChart(costRef.current)
        if (existing) existing.destroy()

        costChart = new Chart(costRef.current, {
          type: 'bar',
          data: {
            labels: ['100 msg', '500 msg', '1000 msg'],
            datasets: [
              { label: 'Raw GPT-4o', data: [0.175, 4.375, 17.5], backgroundColor: '#ef4444', borderRadius: 4 },
              { label: 'Raw GPT-3.5', data: [0.035, 0.875, 3.5], backgroundColor: '#64748b', borderRadius: 4 },
              { label: 'ContextMind', data: [0.0203, 0.4515, 1.778], backgroundColor: '#10b981', borderRadius: 4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => ' $' + ctx.parsed.y.toFixed(4) } },
            },
            scales: {
              x: { ticks: { color: tickColor, font: tickFont }, grid: { display: false } },
              y: { ticks: { color: tickColor, font: tickFont, callback: (v: any) => '$' + v }, grid: { color: gridColor } },
            },
          },
        })
      }

      if (latRef.current) {
        const existing = Chart.getChart(latRef.current)
        if (existing) existing.destroy()

        latChart = new Chart(latRef.current, {
          type: 'bar',
          data: {
            labels: ['Context', 'Peers', 'Sessions'],
            datasets: [
              { label: 'p50', data: [404, 253, 162], backgroundColor: '#3b82f6', borderRadius: 4 },
              { label: 'p95', data: [637, 374, 271], backgroundColor: '#93c5fd', borderRadius: 4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => ' ' + ctx.parsed.y + 'ms' } },
            },
            scales: {
              x: { ticks: { color: tickColor, font: tickFont }, grid: { display: false } },
              y: { ticks: { color: tickColor, font: tickFont, callback: (v: any) => v + 'ms' }, grid: { color: gridColor } },
            },
          },
        })
      }
    }

    init()

    return () => {
      isMounted = false
      if (costChart) costChart.destroy()
      if (latChart) latChart.destroy()
    }
  }, [])

  return (
    <div className="grid grid-cols-1 gap-12">
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 mb-2">Cost comparison</h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">USD per session at scale (including retrieval + processing overhead)</p>
        </div>
        <div className="h-[400px] relative">
          <canvas ref={costRef} />
        </div>
        <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-slate-50">
          {[
            { color: '#ef4444', label: 'Raw GPT-4o' },
            { color: '#64748b', label: 'Raw GPT-3.5' },
            { color: '#10b981', label: 'ContextMind' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest">
              <span className="w-4 h-4 rounded-md" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 mb-2">API latency</h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System performance (p50 / p95) sampled across production endpoints</p>
        </div>
        <div className="h-[400px] relative">
          <canvas ref={latRef} />
        </div>
        <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-slate-50">
          {[
            { color: '#3b82f6', label: 'p50' },
            { color: '#93c5fd', label: 'p95' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest">
              <span className="w-4 h-4 rounded-md" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const containerRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const unsub = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50)
    })
    return () => unsub()
  }, [scrollY])

  return (
    <div ref={containerRef} className="min-h-screen text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative bg-white">
      {/* Dynamic Navbar */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none">
        <motion.nav
          animate={{
            width: isScrolled ? 'fit-content' : '95%',
            maxWidth: isScrolled ? '240px' : '1200px',
            borderRadius: '24px',
            y: isScrolled ? 10 : 5
          }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 15,
            mass: 0.8
          }}
          className="h-16 flex items-center justify-between px-6 pointer-events-auto shadow-2xl glass border border-white/40 backdrop-blur-xl bg-white/70"
        >
          <div className={`flex items-center gap-3 shrink-0 ${isScrolled ? 'mx-auto' : ''}`}>
            <Link href="/" className="flex items-center">
              <span className="font-logo text-2xl tracking-tighter logo-gradient select-none">ContextMind</span>
            </Link>
          </div>

          <AnimatePresence>
            {!isScrolled && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="hidden md:flex items-center gap-8 mx-12"
              >
                <Link href="#problem" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition">Problem</Link>
                <Link href="#features" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition">Features</Link>
                <Link href="#pricing" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition">Pricing</Link>
                <Link href="/docs" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition">Docs</Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isScrolled && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-4 shrink-0"
              >
                <SignedIn>
                  <Link href="/dashboard" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition">Dashboard</Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Log In</Link>
                  <Link href="/sign-up" className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-black transition hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95">
                    Start Free
                  </Link>
                </SignedOut>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
        {/* Anime Background - Full Cover */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/foggy.png"
            alt="Background"
            className="w-full h-full object-cover object-[center_30%] md:object-center opacity-85"
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black tracking-widest uppercase mb-8 shadow-sm">
              Now Open: Developer Beta
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.85] mb-8 text-slate-900">
              Reduce LLM Token <br />Costs <br />
              <span className="logo-gradient">by 90%</span>
            </h1>

            <p className="text-xl text-slate-600 font-bold leading-relaxed mb-10 max-w-2xl">
              AI-native memory that compresses conversations, understands your users, and delivers perfect context — every time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-16">
              <Link href="/sign-up" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-2xl shadow-blue-500/30 group">
                Start Free <ArrowRight size={22} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="text-slate-500 font-black text-lg hover:text-slate-900 transition flex items-center gap-2 px-8 py-4 bg-white/50 backdrop-blur rounded-2xl border border-slate-200">
                View Documentation
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mb-20">
              {[
                '90% Cost Reduction',
                'Auto Summaries',
                'Theory of Mind',
                'Any LLM'
              ].map((bullet, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-100">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-sm font-black text-slate-700 italic">{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Animation below text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full max-w-4xl"
          >
            <TokenCompressionVisual />
          </motion.div>
        </div>
      </section>

      {/* BENCHMARKS SECTION — NATIVE EMBED */}
      <section className="py-24 bg-slate-50/50 overflow-hidden border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-emerald-100/50 text-emerald-700 text-[10px] font-black tracking-widest uppercase mb-6">Performance Audit</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Production Benchmarks</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Real-world performance metrics sampled from production-grade NeonDB and OpenRouter instances.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full"
          >
            <BenchmarkCharts />
          </motion.div>

          <div className="mt-16 bg-white border border-slate-100 rounded-[2rem] p-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-black mb-6">Theory of Mind accuracy</h3>
                <div className="space-y-4">
                  {[
                    { key: 'expertise', pct: 90 },
                    { key: 'communication_style', pct: 88 },
                    { key: 'values', pct: 87 },
                    { key: 'goals', pct: 86 },
                    { key: 'preferences', pct: 85 },
                  ].map(m => (
                    <div key={m.key} className="grid grid-cols-[140px_1fr_40px] items-center gap-4">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">{m.key}</span>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-900">{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-black mb-6">Test Suite Status</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Core pipeline', pass: true, detail: 'PEER → SESSION → INGEST' },
                    { name: 'Token reduction', pass: true, detail: '88–90% SAVINGS' },
                    { name: 'Theory of Mind', pass: true, detail: '8 KEYS EXTRACTED' },
                    { name: 'Latency Audit', pass: true, detail: 'P50 404ms' },
                    { name: 'Authentication', pass: false, detail: 'TIMEOUT (INVALID KEY)' },
                  ].map(t => (
                    <div key={t.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${t.pass ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {t.pass ? '✓' : '✗'}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{t.name}</span>
                      <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section id="problem" className="py-24 bg-white border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-8 text-slate-900">You're Paying for Tokens <br />You Don’t Need</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
              Every LLM call sends entire conversation history. That means repeated context, exploding costs, and slower responses as your history grows.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-black">X</div>
                <div className="text-sm font-bold text-slate-700 uppercase tracking-widest">Repeated context</div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-black">$$</div>
                <div className="text-sm font-bold text-slate-700 uppercase tracking-widest">Exploding costs</div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-black">⌛</div>
                <div className="text-sm font-bold text-slate-700 uppercase tracking-widest">Slower responses</div>
              </div>
            </div>
          </div>
          <ProblemGraph />
        </div>
      </section>

      {/* 3. SOLUTION SECTION */}
      <section id="features" className="py-24 px-6 overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black tracking-tight mb-6 text-gradient">ContextMind Fixes This Automatically</h2>
          <p className="text-lg text-slate-500 font-medium font-logo italic">Professional-grade memory management for high-scale AI products.</p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 relative">
          {[
            { step: 1, title: 'Ingest', desc: 'Send messages once', anim: IngestAnim },
            { step: 2, title: 'Compress', desc: 'We summarize + extract insights', anim: CompressAnim },
            { step: 3, title: 'Retrieve', desc: 'Get optimized context for every LLM call', anim: RetrieveAnim }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 + 0.1, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="group relative bg-white border border-slate-200 p-10 rounded-[2.5rem] hover:border-blue-300 transition-colors duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-slate-900/10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <item.anim />
              </div>
              <div className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Step {item.step}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-600/10 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight mb-8 leading-tight">Built for Developers</h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12">
              ContextMind integrates into your existing LLM pipeline with just two API calls.
              Whether you're using OpenAI, Anthropic, or local models, we provide the ultimate state layer.
            </p>
            <div className="space-y-6">
              {[
                { title: 'Works with any LLM', icon: Globe },
                { title: 'REST + SDK support', icon: Code2 },
                { title: 'Stateless → Stateful upgrade', icon: Cpu }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-blue-400">
                    <item.icon size={20} />
                  </div>
                  <span className="font-bold tracking-tight">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
          <CodeSnippet />
        </div>
      </section>

      {/* 5. CORE FEATURES GRID — BENTO */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tight mb-6 text-slate-900">Built for Reliability at Scale</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">Everything you need to build intelligent, cost-effective AI applications that never forget a detail.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
            {/* Card 1 — Smart Summarization (large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              className="col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-blue-100"
              style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)' }}
            >
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-blue-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-blue-600 mb-5 border border-blue-200/60">
                  <Minimize2 size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Smart Summarization</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">Auto compress every 20 & 60 messages → Infinite memory depth without context loss.</p>
              </div>
            </motion.div>

            {/* Card 2 — Theory of Mind */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="col-span-1 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-purple-100"
              style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 50%, #fdf4ff 100%)' }}
            >
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-purple-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-purple-600 mb-5 border border-purple-200/60">
                  <Brain size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Theory of Mind</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Understands preferences, expertise, and behavior patterns automatically.</p>
              </div>
            </motion.div>

            {/* Card 3 — Vector Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="col-span-1 row-span-2 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-emerald-100"
              style={{ background: 'linear-gradient(180deg, #d1fae5 0%, #ecfdf5 40%, #f0fdf4 100%)' }}
            >
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-emerald-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 bg-emerald-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-200/60">
                  <Search size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Vector Search</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Find relevant context instantly across billions of previous conversation turns.</p>
                <div className="mt-auto pt-6 flex flex-col gap-2">
                  {['Cosine Similarity', 'PgVector', 'Threshold: 0.7'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-lg border border-emerald-200/50 w-fit">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 4 — Token Optimization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="col-span-1 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-amber-100"
              style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fefce8 100%)' }}
            >
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-amber-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-amber-600 mb-5 border border-amber-200/60">
                  <Zap size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Token Optimization</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">60/40 context split for max LLM performance and cost efficiency.</p>
              </div>
            </motion.div>

            {/* Card 5 — Multi-Agent Ready */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
              className="col-span-1 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-rose-100"
              style={{ background: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 50%, #fef2f2 100%)' }}
            >
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-rose-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-rose-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-rose-600 mb-5 border border-rose-200/60">
                  <Layers size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Multi-Agent Ready</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Cross-peer context sharing between users, agents, and objects.</p>
              </div>
            </motion.div>

            {/* Card 6 — Infer API (large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-cyan-100"
              style={{ background: 'linear-gradient(135deg, #cffafe 0%, #ecfeff 50%, #f0fdfa 100%)' }}
            >
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-cyan-300/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-cyan-500/10 backdrop-blur rounded-2xl flex items-center justify-center text-cyan-600 mb-5 border border-cyan-200/60">
                  <Sparkles size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Infer API</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">Ask natural language questions about your users and get synthesized psychological insights with confidence scores.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. LIVE OUTPUT SECTION */}
      <section className="py-24 bg-slate-50 overflow-hidden border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 px-4">
            <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-xs font-black tracking-widest uppercase mb-6">Efficiency Check</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-slate-900">What You Actually Get</h2>
            <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Stop sending thousands of tokens for context. Send exactly what matters.</p>
          </div>
          <ComparisonSection />
        </div>
      </section>

      {/* 7. INFER SECTION */}
      <section className="py-24 border-b border-slate-100 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <InferVisual />
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-8 text-slate-900">Understand Your Users — Automatically</h2>
            <div className="space-y-12">
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-[10px]">1</div>
                <h4 className="text-lg font-bold mb-3 italic text-slate-400 tracking-tight">"What's the best way to respond?"</h4>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 leading-relaxed">
                  ContextMind analyzes the user's communication style, technical expertise, and previous questions to provide a personalized recommendation.
                </div>
              </div>

              <div className="relative pl-10 group">
                <div className="absolute left-0 top-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-[10px]">2</div>
                <div className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-2">Synthesized Insight</div>
                <p className="text-lg font-bold text-slate-800 tracking-tight leading-relaxed">
                  “Use bullet points. Avoid long explanations. Provide code examples.”
                </p>
                <div className="mt-4 flex gap-2">
                  {['Communication: Direct', 'Preference: Technical', 'Style: Conciseness'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-100">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. USE CASES — BENTO */}
      <section className="py-24 px-6 relative bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Built for Every AI Product</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {/* AI SaaS — wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              className="col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-violet-100 flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #faf5ff 100%)' }}
            >
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-violet-300/15 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-violet-500 uppercase tracking-[0.25em] mb-3">Use Case</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">AI SaaS</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">Reduce infrastructure costs by 90% while delivering richer, more personalized AI experiences to every user.</p>
              </div>
            </motion.div>

            {/* Customer Support — tall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="col-span-1 row-span-2 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-sky-100 flex flex-col justify-between"
              style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 40%, #f8fafc 100%)' }}
            >
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-sky-300/15 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-sky-500 uppercase tracking-[0.25em] mb-3">Use Case</div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Customer Support</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Remember every user's history, preferences, and past issues across all support channels.</p>
              </div>
              <div className="relative z-10 mt-auto pt-6 flex flex-col gap-2">
                {['Ticket Context', 'User History', 'Agent Handoff'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-3 py-1.5 bg-sky-500/10 text-sky-700 rounded-lg border border-sky-200/50 w-fit">{tag}</span>
                ))}
              </div>
            </motion.div>

            {/* AI Copilots */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="col-span-1 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-orange-100 flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #ffedd5 0%, #fff7ed 50%, #fffbeb 100%)' }}
            >
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-orange-300/15 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em] mb-3">Use Case</div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">AI Copilots</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Highly personalized outputs tailored to each user's style.</p>
              </div>
            </motion.div>

            {/* Multi-Agent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="col-span-1 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-teal-100 flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 50%, #f0fdf4 100%)' }}
            >
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-teal-300/15 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.25em] mb-3">Use Case</div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Multi-Agent</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Shared collective memory across all your AI agents.</p>
              </div>
            </motion.div>

            {/* Recruiting / HR — wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
              className="col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group cursor-default border border-pink-100 flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #fef7ff 100%)' }}
            >
              <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-pink-300/15 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black text-pink-500 uppercase tracking-[0.25em] mb-3">Use Case</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Recruiting & HR</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">Deep psychological profiling and relationship intelligence for candidate matching and team dynamics.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9. PRICING */}
      <section id="pricing" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-50" />
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-xs font-black tracking-widest uppercase mb-6">Pricing</div>
            <h2 className="text-5xl font-black tracking-tight mb-4 text-slate-900">Simple, Transparent</h2>
            <p className="text-slate-500 font-medium">One plan. No surprises.</p>
          </div>

          <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl bg-white">
            {/* Price Header */}
            <div className="text-center pt-12 pb-10 px-8 bg-gradient-to-b from-slate-50 to-white text-slate-900">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-7xl font-black tracking-tighter leading-none">$2</span>
                <span className="text-slate-400 font-bold text-sm">/ 1M tokens</span>
              </div>
              <p className="text-slate-400 text-sm font-medium mt-3">Only pay for what you ingest. Retrieval is always free.</p>
            </div>

            {/* Features */}
            <div className="px-10 pb-10">
              <div className="space-y-4 mb-10">
                {[
                  { text: 'Unlimited context retrieval', highlight: 'FREE' },
                  { text: 'Unlimited API calls', highlight: '∞' },
                  { text: 'Auto summarization & Theory of Mind', highlight: null },
                  { text: 'Vector search (PgVector)', highlight: null },
                  { text: 'Python, JS, TS & React SDKs', highlight: null },
                  { text: 'Multi-agent shared memory', highlight: null },
                  { text: '~90% token cost reduction', highlight: '90%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                    {item.highlight && (
                      <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{item.highlight}</span>
                    )}
                  </div>
                ))}
              </div>

              <Link href="/sign-up" className="block w-full bg-slate-900 text-white py-4 rounded-2xl text-center font-black text-base hover:bg-slate-800 transition shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                Get Started Free →
              </Link>
              <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="relative overflow-hidden bg-slate-900">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 opacity-40"
          style={{ backgroundImage: "url('/twoo.png')" }}
        />

        <div className="relative z-10 pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 mb-20 text-white">
            <Link href="/" className="flex flex-col items-center md:items-start group">
              <div className="font-logo text-3xl tracking-tighter bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent select-none group-hover:scale-105 transition-transform duration-300">ContextMind</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Memory Layer for LLMs</div>
            </Link>

            <div className="flex gap-12">
              {[
                { label: 'Product', links: ['Features', 'Pricing', 'API Docs'] },
                { label: 'Company', links: ['About', 'Contact', 'Status'] },
                { label: 'Developer', links: ['Github', 'SDK', 'Support'] }
              ].map(col => (
                <div key={col.label}>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{col.label}</div>
                  <div className="flex flex-col gap-2">
                    {col.links.map(l => (
                      <Link key={l} href="#" className="text-xs font-bold text-slate-400 hover:text-white transition">{l}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 md:mt-0 text-center md:text-right">
              © 2026 ContextMind · Built for AI performance
            </div>
          </div>

          {/* Large CONTEXTMIND text */}
          <div className="text-center select-none overflow-hidden pb-10">
            <div
              className="font-logo text-[8rem] md:text-[12rem] lg:text-[16rem] font-black tracking-tighter leading-none bg-gradient-to-b from-white/20 via-white/5 to-transparent bg-clip-text text-transparent"
            >
              CONTEXTMIND
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}