import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-6">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-sm font-bold text-white">CM</div>
        <span className="text-white font-bold text-xl tracking-tight">ContextMind</span>
      </Link>
      <SignIn
        appearance={{
          elements: {
            card: 'bg-slate-800 border border-slate-700 shadow-2xl',
            headerTitle: 'text-white font-bold',
            headerSubtitle: 'text-slate-400',
            socialButtonsBlockButton: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
            dividerLine: 'bg-slate-700',
            dividerText: 'text-slate-500',
            formFieldLabel: 'text-slate-300',
            formFieldInput: 'bg-slate-900 border-slate-600 text-white focus:border-blue-500',
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-500',
            footerActionLink: 'text-blue-400 hover:text-blue-300',
            footerActionText: 'text-slate-400',
            identityPreviewText: 'text-white',
            identityPreviewEditButton: 'text-blue-400',
          },
        }}
      />
    </div>
  )
}
