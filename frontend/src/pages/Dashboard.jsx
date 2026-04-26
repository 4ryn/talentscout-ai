import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getJobs } from '../api/api'
import { Users, Briefcase, BarChart3, ArrowRight, Clock, Zap, ChevronRight } from 'lucide-react'

const PIPELINE_STEPS = [
  { label: 'JD Parser',      color: '#6C63FF', desc: 'Extracts skills' },
  { label: 'Resume Parser',  color: '#6C63FF', desc: 'Profiles candidates' },
  { label: 'Retrieval',      color: '#8B5CF6', desc: 'Vector search' },
  { label: 'Match Agent',    color: '#06B6D4', desc: 'Scores fit' },
  { label: 'Engagement',     color: '#10B981', desc: 'Simulates chat' },
  { label: 'Interest Agent', color: '#F59E0B', desc: 'Rates enthusiasm' },
  { label: 'Ranking',        color: '#F472B6', desc: 'Final score' },
  { label: 'Explainability', color: '#A78BFA', desc: 'Summaries' },
]

function PipelineFlow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % PIPELINE_STEPS.length), 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {PIPELINE_STEPS.map((step, i) => {
        const isActive = i === active
        const isPast   = i < active
        return (
          <div key={step.label} className="flex items-center flex-shrink-0">
            <div className="relative flex flex-col items-center transition-all duration-400" style={{ minWidth: 88 }}>
              <div className="w-1.5 h-1.5 rounded-full mb-2 transition-all duration-300" style={{
                background:  isActive ? step.color : isPast ? step.color + '60' : 'rgba(255,255,255,0.08)',
                boxShadow:   isActive ? `0 0 8px ${step.color}` : 'none',
              }} />
              <div className="rounded-xl px-3 py-2.5 text-center transition-all duration-300" style={{
                background: isActive ? `linear-gradient(135deg, ${step.color}22, ${step.color}0D)` : isPast ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)',
                border:    `1px solid ${isActive ? step.color + '55' : isPast ? step.color + '22' : 'rgba(255,255,255,0.06)'}`,
                boxShadow:  isActive ? `0 0 16px ${step.color}25` : 'none',
                transform:  isActive ? 'translateY(-2px)' : 'none',
                width: 82,
              }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10, color: isActive ? step.color : isPast ? step.color + 'AA' : 'rgba(200,200,230,0.35)', lineHeight: 1.2, marginBottom: 3 }}>
                  {step.label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: isActive ? 'rgba(220,220,255,0.65)' : 'rgba(150,150,190,0.3)', lineHeight: 1.3 }}>
                  {step.desc}
                </div>
              </div>
              <div className="mt-2" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: isActive ? step.color : 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="flex items-center mx-0.5 flex-shrink-0" style={{ marginTop: -16 }}>
                <div style={{ width: 14, height: 1, background: i < active ? `linear-gradient(90deg, ${PIPELINE_STEPS[i].color}60, ${PIPELINE_STEPS[i+1].color}60)` : 'rgba(255,255,255,0.07)', transition: 'background 0.4s' }} />
                <svg width="6" height="8" viewBox="0 0 6 8" style={{ flexShrink: 0 }}>
                  <path d="M0,0 L6,4 L0,8 Z" fill={i < active ? PIPELINE_STEPS[i].color + '60' : 'rgba(255,255,255,0.08)'} />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={{
      background: 'rgba(12,12,22,0.7)',
      border: '1px solid rgba(108,99,255,0.1)',
      backdropFilter: 'blur(16px)',
    }}>
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at 70% 25%, ${color}15, transparent 65%)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#10B981' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          live
        </div>
      </div>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 34, color: '#afafc3', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(140,140,180,0.6)', marginTop: 5 }}>
        {label}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, evaluations: 0 })
  const [jobs, setJobs]   = useState([])
  const navigate = useNavigate()

  // Poll every 5s so numbers update after a pipeline run without refresh
  useEffect(() => {
    const fetchData = () => {
      getStats().then(r => setStats(r.data)).catch(() => {})
      getJobs().then(r => setJobs(r.data)).catch(() => {})
    }
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-8 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.22)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6C63FF' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6C63FF', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              AI Pipeline Active
            </span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 42, lineHeight: 1.05, color: '#a4a4cb', letterSpacing: '-0.02em', marginBottom: 10 }}>
            Discover Top Talent,<br />
            <span style={{ background: 'linear-gradient(135deg, #6C63FF, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Instantly.
            </span>
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(140,140,180,0.65)', maxWidth: 400, lineHeight: 1.65 }}>
            8-agent AI pipeline that scores, ranks, and explains every candidate in seconds — all uploads evaluated, no cap.
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
          style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff',
            background: 'linear-gradient(135deg, #5046E5, #6C63FF)',
            boxShadow: '0 8px 28px rgba(108,99,255,0.35)',
            border: '1px solid rgba(108,99,255,0.4)',
          }}
        >
          <Zap size={14} fill="currentColor" />
          Start New Search
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Live Stats — auto-refresh every 5s */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Jobs Uploaded"     value={stats.jobs}        icon={Briefcase} color="#6C63FF" />
        <StatCard label="Candidates Parsed" value={stats.candidates}  icon={Users}     color="#10B981" />
        <StatCard label="Shortlisted Candidates" value={stats.shortlisted || 0} icon={Users} color="#F472B6" />
      </div>

      {/* Pipeline animation */}
      <div className="rounded-2xl p-5 mb-6" style={{
        background: 'rgba(10,10,20,0.7)', border: '1px solid rgba(108,99,255,0.1)', backdropFilter: 'blur(16px)',
      }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8E8F0' }}>
              Pipeline Architecture
            </h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(108,99,255,0.5)', marginTop: 2, letterSpacing: '0.08em' }}>
              8-agent LangGraph DAG · evaluates all candidates
            </p>
          </div>
          <div className="flex items-center gap-1.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#10B981' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All agents online
          </div>
        </div>
        <PipelineFlow />
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <div className="rounded-2xl p-5" style={{
          background: 'rgba(10,10,20,0.7)', border: '1px solid rgba(108,99,255,0.1)', backdropFilter: 'blur(16px)',
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8E8F0', marginBottom: 14 }}>
            Recent Jobs
          </h2>
          <div className="space-y-2">
            {jobs.slice(0, 5).map(job => (
              <button
                key={job.id}
                onClick={() => navigate(`/results/${job.id}`)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                style={{ background: 'rgba(14,14,28,0.6)', border: '1px solid rgba(108,99,255,0.1)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.1)'; e.currentTarget.style.background = 'rgba(14,14,28,0.6)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
                    <Briefcase size={13} style={{ color: '#6C63FF' }} />
                  </div>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#C8C8E8' }}>
                    {job.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(108,99,255,0.4)' }}>
                    <Clock size={10} />
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight size={13} style={{ color: 'rgba(108,99,255,0.35)' }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}