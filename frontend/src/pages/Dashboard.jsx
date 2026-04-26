import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getJobs } from '../api/api'
import { Users, Briefcase, BarChart3, ChevronRight, Zap, ArrowRight, Clock } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, evaluations: 0 })
  const [jobs, setJobs] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {})
    getJobs().then(r => setJobs(r.data)).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Jobs Uploaded', value: stats.jobs, icon: Briefcase, color: '#6C63FF' },
    { label: 'Candidates Parsed', value: stats.candidates, icon: Users, color: '#10B981' },
    { label: 'Evaluations Run', value: stats.evaluations, icon: BarChart3, color: '#F59E0B' },
  ]

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scout-accent/15 border border-scout-accent/30 text-scout-accent text-xs font-mono tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-scout-accent animate-pulse" />
          AI-Powered Talent Intelligence
        </div>
        <h1 className="font-display font-800 text-4xl text-scout-text mb-3 leading-tight">
          Discover Top Talent,<br />
          <span className="bg-gradient-to-r from-scout-accent to-scout-glow bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>
        <p className="text-scout-muted text-base max-w-lg leading-relaxed">
          Upload a job description and resumes. Our 8-agent AI pipeline scores, ranks, and explains every candidate — in seconds.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-5 glow-accent">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs text-scout-muted font-mono">LIVE</span>
            </div>
            <div className="font-display font-700 text-3xl text-scout-text mb-1">{value}</div>
            <div className="text-sm text-scout-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary flex items-center gap-2 text-base px-6 py-3"
        >
          <Zap size={16} />
          Start New Search
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Pipeline Architecture */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h2 className="font-display font-700 text-scout-text text-lg mb-5">Pipeline Architecture</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { name: 'JD Parser', desc: 'Extracts role, skills, keywords' },
            { name: 'Resume Parser', desc: 'Profiles each candidate' },
            { name: 'Retrieval', desc: 'Qdrant semantic search' },
            { name: 'Match Agent', desc: 'Scores fit & gaps' },
            { name: 'Engagement', desc: 'Simulates conversation' },
            { name: 'Interest Agent', desc: 'Scores enthusiasm' },
            { name: 'Ranking', desc: 'Weighted final score' },
            { name: 'Explainability', desc: 'Recruiter summaries' },
          ].map((step, i, arr) => (
            <div key={step.name} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="px-3 py-2 rounded-lg bg-scout-card border border-scout-accent/20 text-center" style={{ minWidth: 100 }}>
                  <div className="text-xs font-display font-600 text-scout-accent">{step.name}</div>
                  <div className="text-[10px] text-scout-muted mt-0.5 leading-tight">{step.desc}</div>
                </div>
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} className="text-scout-border flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-700 text-scout-text text-lg mb-4">Recent Jobs</h2>
          <div className="space-y-2">
            {jobs.slice(0, 5).map(job => (
              <button
                key={job.id}
                onClick={() => navigate(`/results/${job.id}`)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-scout-card hover:bg-scout-border border border-scout-border hover:border-scout-accent/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={14} className="text-scout-accent" />
                  <span className="text-sm text-scout-text font-medium">{job.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-scout-muted flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight size={14} className="text-scout-muted group-hover:text-scout-accent transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}