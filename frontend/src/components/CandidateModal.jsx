import { X, MessageSquare, Brain, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { ScoreRing, ScoreBar } from './ScoreComponents'

export default function CandidateModal({ candidate, rank, onClose }) {
  if (!candidate) return null

  const { name, skills, experience_years, summary,
    match_score, interest_score, final_score,
    match_explanation, missing_skills, interest_reasoning,
    full_explanation, conversation } = candidate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-scout-card border border-scout-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-scout-card border-b border-scout-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-scout-accent to-scout-glow flex items-center justify-center text-white font-display font-700 text-sm">
              {name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="font-display font-700 text-scout-text text-lg">{name}</h2>
              <p className="text-xs text-scout-muted">{experience_years} yrs exp • Rank #{rank}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-scout-border transition-colors text-scout-muted hover:text-scout-text">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Scores Row */}
          <div className="flex items-center justify-around p-5 bg-scout-surface rounded-xl border border-scout-border">
            <ScoreRing score={match_score} label="Match" color="#6C63FF" size={90} />
            <div className="h-16 w-px bg-scout-border" />
            <ScoreRing score={interest_score} label="Interest" color="#10B981" size={90} />
            <div className="h-16 w-px bg-scout-border" />
            <ScoreRing score={final_score} label="Final" color="#F59E0B" size={90} />
          </div>

          {/* Summary */}
          {summary && (
            <div>
              <h3 className="text-xs font-mono text-scout-muted uppercase tracking-widest mb-2">Profile Summary</h3>
              <p className="text-sm text-scout-text leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Skills */}
          <div>
            <h3 className="text-xs font-mono text-scout-muted uppercase tracking-widest mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(skills || []).map(s => (
                <span key={s} className="skill-tag bg-scout-accent/15 text-scout-accent border border-scout-accent/25">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {missing_skills?.length > 0 && (
            <div>
              <h3 className="text-xs font-mono text-scout-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-400" />
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {missing_skills.map(s => (
                  <span key={s} className="skill-tag bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Match Explanation */}
          <div className="p-4 bg-scout-accent/10 border border-scout-accent/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-scout-accent" />
              <span className="text-xs font-display font-600 text-scout-accent uppercase tracking-wider">Match Analysis</span>
            </div>
            <p className="text-sm text-scout-text leading-relaxed">{match_explanation}</p>
          </div>

          {/* Interest Reasoning */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-emerald-400" />
              <span className="text-xs font-display font-600 text-emerald-400 uppercase tracking-wider">Interest Analysis</span>
            </div>
            <p className="text-sm text-scout-text leading-relaxed">{interest_reasoning}</p>
          </div>

          {/* Full Explanation */}
          {full_explanation && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-amber-400" />
                <span className="text-xs font-display font-600 text-amber-400 uppercase tracking-wider">Recruiter Recommendation</span>
              </div>
              <p className="text-sm text-scout-text leading-relaxed">{full_explanation}</p>
            </div>
          )}

          {/* Conversation */}
          {conversation?.length > 0 && (
            <div>
              <h3 className="text-xs font-mono text-scout-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare size={12} />
                Simulated Conversation
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {conversation.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'recruiter' ? 'justify-start' : 'justify-end'}`}>
                    {msg.role === 'recruiter' && (
                      <div className="w-7 h-7 rounded-full bg-scout-accent/20 flex items-center justify-center text-scout-accent text-[10px] font-mono flex-shrink-0 mt-1">R</div>
                    )}
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'recruiter'
                        ? 'bg-scout-surface border border-scout-border text-scout-text rounded-tl-sm'
                        : 'bg-scout-accent/20 border border-scout-accent/30 text-scout-text rounded-tr-sm'
                    }`}>
                      {msg.message}
                    </div>
                    {msg.role === 'candidate' && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-mono flex-shrink-0 mt-1">
                        {name?.charAt(0) || 'C'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}