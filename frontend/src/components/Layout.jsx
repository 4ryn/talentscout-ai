import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, RotateCcw } from 'lucide-react'
import { resetSystem } from '../api/api'
import toast from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload & Run' },
]

function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const lines = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: Math.random() * 200 + 60,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.003,
      opacity: Math.random() * 0.06 + 0.02,
    }))

    const orbs = [
      { x: W * 0.15, y: H * 0.3, r: 320, color: '108,99,255', opacity: 0.07 },
      { x: W * 0.85, y: H * 0.7, r: 280, color: '16,185,129', opacity: 0.05 },
      { x: W * 0.5,  y: H * 0.1, r: 200, color: '139,92,246', opacity: 0.04 },
    ]

    function draw() {
      ctx.clearRect(0, 0, W, H)

      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, `rgba(${o.color},${o.opacity})`)
        g.addColorStop(1, `rgba(${o.color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.strokeStyle = 'rgba(108,99,255,0.04)'
      ctx.lineWidth = 1
      for (let x = -H; x < W + H; x += 80) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + H, H)
        ctx.stroke()
      }

      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(108,99,255,${p.opacity})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(108,99,255,${0.08 * (1 - d / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      lines.forEach(l => {
        l.angle += l.speed
        const x2 = l.x + Math.cos(l.angle) * l.len
        const y2 = l.y + Math.sin(l.angle) * l.len
        const g = ctx.createLinearGradient(l.x, l.y, x2, y2)
        g.addColorStop(0, `rgba(108,99,255,0)`)
        g.addColorStop(0.5, `rgba(108,99,255,${l.opacity})`)
        g.addColorStop(1, `rgba(108,99,255,0)`)
        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = g
        ctx.lineWidth = 1
        ctx.stroke()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#07070E' }}
    />
  )
}

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
    <div className="flex h-screen overflow-hidden" style={{ background: '#07070E' }}>
      <AnimatedBackground />

      {/* Sidebar — wider to fit name */}
      <aside
        className="relative z-10 flex-shrink-0 flex flex-col py-6 border-r"
        style={{
          width: 200,
          background: 'rgba(10,10,20,0.85)',
          borderColor: 'rgba(108,99,255,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.35), transparent)' }} />

        {/* Brand */}
        <div className="px-5 mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            {/* Icon — no background box, just SVG */}
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <ellipse cx="9"  cy="26" rx="5"   ry="3.5" fill="rgba(108,99,255,0.35)" />
              <circle  cx="9"  cy="20" r="3.5"            fill="rgba(108,99,255,0.35)" />
              <ellipse cx="29" cy="26" rx="5"   ry="3.5" fill="rgba(108,99,255,0.35)" />
              <circle  cx="29" cy="20" r="3.5"            fill="rgba(108,99,255,0.35)" />
              <circle  cx="19" cy="18" r="8" stroke="#6C63FF" strokeWidth="2.2" fill="rgba(108,99,255,0.08)" />
              <circle  cx="19" cy="15.5" r="2.2" fill="#6C63FF" />
              <path d="M14.5 22c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <line x1="19"   y1="7"   x2="19"   y2="5"   stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="23.5" y1="8.3" x2="24.5" y2="6.6" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="14.5" y1="8.3" x2="13.5" y2="6.6" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="25"   y1="24"  x2="30"   y2="29"  stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            <div>
              <div style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 1000,
                fontSize: 15,
                letterSpacing: '-0.02em',
                color: '#E8E8F0',
                lineHeight: 1.2,
              }}>
                TalentScout
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10.5,
                color: '#6C63FF',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.8,
                marginTop: 2,
              }}>
                AI-Powered
              </div>
            </div>
          </div>

          {/* Thin divider */}
          <div className="mt-4" style={{ height: 1, background: 'linear-gradient(90deg, rgba(108,99,255,0.25), transparent)' }} />
        </div>

        {/* Nav section label */}
        <div className="px-5 mb-2">
          <span style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 15.5,
            color: 'rgba(108,99,255,0.4)',
            letterSpacing: '0.1em',
            // textTransform: 'uppercase',
          }}>
            Menu
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive ? 'active-link' : 'inactive-link'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(108,99,255,0.35)' : 'transparent'}`,
                boxShadow: isActive ? '0 0 14px rgba(108,99,255,0.18)' : 'none',
                color: isActive ? '#A89CFF' : 'rgba(108,99,255,0.45)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} style={{ color: isActive ? '#A89CFF' : 'rgba(108,99,255,0.4)', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#C8C0FF' : 'rgba(140,140,180,0.6)',
                  }}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1 h-1 rounded-full" style={{ background: '#6C63FF', flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status pill
        <div className="px-4 mb-4">
          <div className="px-3 py-2 rounded-xl" style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#10B981', letterSpacing: '0.06em' }}>
                5/5 agents online
              </span>
            </div>
          </div>
        </div> */}

        {/* Reset */}
        <div className="px-3" style={{ borderTop: '1px solid rgba(108,99,255,0.08)', paddingTop: 12 }}>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{
              color: 'rgba(239,68,68,0.45)',
              border: '1px solid transparent',
              background: 'transparent',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#EF4444'
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(239,68,68,0.45)'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset System'}
          </button>
        </div>

        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.2), transparent)' }} />
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}