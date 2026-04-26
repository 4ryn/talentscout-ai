import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, BarChart3, Zap, RotateCcw } from 'lucide-react'
import { resetSystem } from '../api/api'
import toast from 'react-hot-toast'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload & Run' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    if (!confirm('Reset all data? This cannot be undone.')) return
    setResetting(true)
    try {
      await resetSystem()
      toast.success('System reset — all data cleared')
      navigate('/')
    } catch {
      toast.error('Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-scout-bg">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-scout-border bg-scout-surface">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-scout-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-scout-accent to-scout-glow flex items-center justify-center glow-accent">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display font-700 text-scout-text text-[15px] leading-tight">TalentScout</div>
              <div className="text-[10px] text-scout-muted font-mono tracking-widest uppercase">AI-Powered</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-scout-accent/20 text-scout-accent border border-scout-accent/30'
                    : 'text-scout-muted hover:text-scout-text hover:bg-scout-card'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Reset */}
        <div className="px-3 pb-6">
          <div className="h-px bg-scout-border mb-4" />
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 border border-transparent hover:border-red-500/20 disabled:opacity-50"
          >
            <RotateCcw size={15} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset System'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-mesh">
        <Outlet />
      </main>
    </div>
  )
}