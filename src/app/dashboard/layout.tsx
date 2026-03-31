import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center">
            <span className="font-logo text-2xl tracking-tighter logo-gradient select-none hover:scale-105 transition-transform duration-300">ContextMind</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', label: 'Workspaces', icon: '🏗️' },
            { href: '/dashboard/usage', label: 'Usage & Billing', icon: '📊' },
            { href: '/docs', label: 'Documentation', icon: '📖' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-medium">
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-slate-400 text-sm">Account</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
