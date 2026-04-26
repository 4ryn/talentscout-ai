import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResults } from '../api/api'
import { ScoreBar, RankBadge } from '../components/ScoreComponents'
import CandidateModal from '../components/CandidateModal'
import { Search, SlidersHorizontal, Trophy, ChevronUp, ChevronDown, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function Results() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('final_score')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(null)
  const [minScore, setMinScore] = useState(0)
  const [view, setView] = useState('table') // table | chart

  useEffect(() => {
    if (!jobId) return
    setLoading(true)
    getResults(jobId)
      .then(r => setCandidates(r.data.candidates || []))
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load results'))
      .finally(() => setLoading(false))
  }, [jobId])

  const filtered = candidates
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      c.final_score >= minScore / 100
    )
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      return mul * (a[sortKey] - b[sortKey])
    })

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
  }

  const chartData = filtered.slice(0, 8).map(c => ({
    name: c.name.split(' ')[0],
    match: Math.round(c.match_score * 100),
    interest: Math.round(c.interest_score * 100),
    final: Math.round(c.final_score * 100),
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-scout-accent mx-auto mb-4" />
        <p className="text-scout-muted font-display">Loading results...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center glass rounded-2xl p-8 max-w-md">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Run Pipeline First</button>
      </div>
    </div>
  )

  const top3 = filtered.slice(0, 3)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-scout-muted hover:text-scout-text mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="font-display font-700 text-3xl text-scout-text">
            Ranked Shortlist
          </h1>
          <p className="text-scout-muted mt-1 text-sm">{candidates.length} candidates evaluated • sorted by final score</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('table')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${view === 'table' ? 'bg-scout-accent/20 text-scout-accent border-scout-accent/30' : 'text-scout-muted border-scout-border hover:border-scout-accent/30'}`}
          >Table</button>
          <button
            onClick={() => setView('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${view === 'chart' ? 'bg-scout-accent/20 text-scout-accent border-scout-accent/30' : 'text-scout-muted border-scout-border hover:border-scout-accent/30'}`}
          >Chart</button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 1 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {top3.map((c, i) => (
            <button
              key={c.candidate_id}
              onClick={() => setSelected({ candidate: c, rank: i + 1 })}
              className="glass rounded-2xl p-5 text-left hover:border-scout-accent/40 transition-all group glow-accent"
            >
              <div className="flex items-start justify-between mb-3">
                <RankBadge rank={i + 1} />
                {i === 0 && <Trophy size={16} className="text-amber-400" />}
              </div>
              <div className="font-display font-600 text-scout-text mb-1 group-hover:text-scout-accent transition-colors">
                {c.name}
              </div>
              <div className="text-xs text-scout-muted mb-4">{c.experience_years}y exp</div>
              <ScoreBar score={c.match_score} color="#6C63FF" label="Match" />
              <div className="mt-2">
                <ScoreBar score={c.interest_score} color="#10B981" label="Interest" />
              </div>
              <div className="mt-3 pt-3 border-t border-scout-border flex items-center justify-between">
                <span className="text-xs text-scout-muted">Final Score</span>
                <span className="font-display font-700 text-scout-text">{Math.round(c.final_score * 100)}%</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chart View */}
      {view === 'chart' && chartData.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-display font-600 text-scout-text mb-4">Score Comparison</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252535" />
              <XAxis dataKey="name" tick={{ fill: '#6B6B8A', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B6B8A', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1A1A26', border: '1px solid #252535', borderRadius: 8, fontFamily: 'DM Sans' }}
                labelStyle={{ color: '#E8E8F0', fontFamily: 'Syne' }}
              />
              <Bar dataKey="match" name="Match" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="interest" name="Interest" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="final" name="Final" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-scout-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="w-full pl-9 pr-4 py-2.5 bg-scout-card border border-scout-border rounded-lg text-sm text-scout-text placeholder:text-scout-muted focus:outline-none focus:border-scout-accent/50"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-scout-card border border-scout-border rounded-lg">
          <SlidersHorizontal size={13} className="text-scout-muted" />
          <span className="text-xs text-scout-muted">Min Score:</span>
          <input
            type="range" min="0" max="100" step="5"
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-24 accent-scout-accent"
          />
          <span className="text-xs font-mono text-scout-accent">{minScore}%</span>
        </div>
        <div className="text-sm text-scout-muted font-mono">{filtered.length} shown</div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-scout-border">
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider">Rank</th>
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider">Candidate</th>
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider">Skills</th>
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider cursor-pointer hover:text-scout-accent" onClick={() => toggleSort('match_score')}>
                <span className="flex items-center gap-1">Match <SortIcon col="match_score" /></span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider cursor-pointer hover:text-scout-accent" onClick={() => toggleSort('interest_score')}>
                <span className="flex items-center gap-1">Interest <SortIcon col="interest_score" /></span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-mono text-scout-muted uppercase tracking-wider cursor-pointer hover:text-scout-accent" onClick={() => toggleSort('final_score')}>
                <span className="flex items-center gap-1">Final <SortIcon col="final_score" /></span>
              </th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const globalRank = candidates.findIndex(x => x.candidate_id === c.candidate_id) + 1
              return (
                <tr key={c.candidate_id} className="border-b border-scout-border/50 hover:bg-scout-card/50 transition-colors group">
                  <td className="px-5 py-4">
                    <RankBadge rank={globalRank} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-scout-text">{c.name}</div>
                    <div className="text-xs text-scout-muted mt-0.5">{c.experience_years}y experience</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(c.skills || []).slice(0, 3).map(s => (
                        <span key={s} className="skill-tag bg-scout-accent/10 text-scout-accent border border-scout-accent/20">{s}</span>
                      ))}
                      {c.skills?.length > 3 && (
                        <span className="skill-tag bg-scout-border text-scout-muted">+{c.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 w-32">
                    <div className="text-sm font-mono text-scout-accent mb-1">{Math.round(c.match_score * 100)}%</div>
                    <ScoreBar score={c.match_score} color="#6C63FF" />
                  </td>
                  <td className="px-5 py-4 w-32">
                    <div className="text-sm font-mono text-emerald-400 mb-1">{Math.round(c.interest_score * 100)}%</div>
                    <ScoreBar score={c.interest_score} color="#10B981" />
                  </td>
                  <td className="px-5 py-4 w-32">
                    <div className="text-sm font-mono text-amber-400 mb-1 font-600">{Math.round(c.final_score * 100)}%</div>
                    <ScoreBar score={c.final_score} color="#F59E0B" />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected({ candidate: c, rank: globalRank })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-scout-accent border border-scout-accent/20 hover:bg-scout-accent/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink size={11} />
                      Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-scout-muted">No candidates match your filters</div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <CandidateModal
          candidate={selected.candidate}
          rank={selected.rank}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}