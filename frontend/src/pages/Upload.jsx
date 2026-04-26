import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, FileText, Users, Play, CheckCircle, Loader2, X, ChevronRight } from 'lucide-react'
import { uploadJD, uploadResumes, runPipeline } from '../api/api'
import toast from 'react-hot-toast'

function DropZone({ onDrop, accept, label, icon: Icon, files, maxFiles = 1, color = '#6C63FF' }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragActive
          ? 'border-scout-accent bg-scout-accent/10'
          : files.length > 0
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-scout-border hover:border-scout-accent/50 hover:bg-scout-accent/5'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {files.length > 0 ? (
          <CheckCircle size={32} className="text-emerald-400" />
        ) : (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}
          >
            <Icon size={24} style={{ color }} />
          </div>
        )}
        <div>
          <p className="font-display font-600 text-scout-text">{label}</p>
          <p className="text-sm text-scout-muted mt-1">
            {isDragActive ? 'Drop it here' : 'PDF, DOCX, or TXT · drag & drop or click'}
          </p>
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  { id: 'jd', label: 'Upload JD' },
  { id: 'resumes', label: 'Upload Resumes' },
  { id: 'run', label: 'Run Pipeline' },
  { id: 'done', label: 'View Results' },
]

export default function Upload() {
  const navigate = useNavigate()
  const [jdFile, setJdFile] = useState(null)
  const [resumeFiles, setResumeFiles] = useState([])
  const [jobId, setJobId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('idle') // idle | uploading_jd | uploading_resumes | running | done
  const [pipelineLog, setPipelineLog] = useState([])

  const addLog = (msg, type = 'info') => {
    setPipelineLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }])
  }

  const onDropJD = useCallback(files => {
    if (files[0]) setJdFile(files[0])
  }, [])

  const onDropResumes = useCallback(files => {
    setResumeFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...files.filter(f => !names.has(f.name))]
    })
  }, [])

  const removeResume = (name) => {
    setResumeFiles(prev => prev.filter(f => f.name !== name))
  }

  const handleRun = async () => {
    if (!jdFile) return toast.error('Please upload a Job Description first')
    if (resumeFiles.length === 0) return toast.error('Please upload at least one resume')

    setLoading(true)
    setPipelineLog([])

    try {
      // Step 1: Upload JD
      setStep('uploading_jd')
      addLog('Uploading Job Description...', 'info')
      const jdRes = await uploadJD(jdFile)
      const jid = jdRes.data.job_id
      setJobId(jid)
      addLog(`✓ JD uploaded — "${jdRes.data.title}"`, 'success')

      // Step 2: Upload Resumes
      setStep('uploading_resumes')
      addLog(`Parsing ${resumeFiles.length} resume(s) with LLM...`, 'info')
      const resumeRes = await uploadResumes(resumeFiles)
      addLog(`✓ ${resumeRes.data.uploaded} candidates indexed in Qdrant`, 'success')

      // Step 3: Run Pipeline
      setStep('running')
      addLog('Launching 8-agent LangGraph pipeline...', 'info')
      addLog('  → JD Parser extracting role & skills', 'muted')
      addLog('  → Retrieval Agent searching Qdrant', 'muted')
      addLog('  → Match Agent scoring each candidate', 'muted')
      addLog('  → Engagement Agent simulating conversations', 'muted')
      addLog('  → Interest Agent evaluating enthusiasm', 'muted')
      addLog('  → Ranking + Explainability agents finalizing', 'muted')

      const pipelineRes = await runPipeline(jid)
      addLog(`✓ Pipeline complete — ${pipelineRes.data.candidates_processed} candidates ranked`, 'success')

      setStep('done')
      toast.success('Pipeline complete!')

      setTimeout(() => navigate(`/results/${jid}`), 800)

    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Unknown error'
      addLog(`✗ Error: ${msg}`, 'error')
      toast.error(msg)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  const currentStepIdx = STEPS.findIndex(s => {
    if (step === 'idle') return s.id === 'jd'
    if (step === 'uploading_jd') return s.id === 'jd'
    if (step === 'uploading_resumes') return s.id === 'resumes'
    if (step === 'running') return s.id === 'run'
    if (step === 'done') return s.id === 'done'
    return false
  })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-700 text-3xl text-scout-text mb-2">Upload & Run Pipeline</h1>
        <p className="text-scout-muted text-sm">Provide a JD and resumes to kick off the AI scouting pipeline</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i < currentStepIdx ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              i === currentStepIdx ? 'bg-scout-accent/20 text-scout-accent border border-scout-accent/30' :
              'text-scout-muted border border-scout-border'
            }`}>
              {i < currentStepIdx && <CheckCircle size={11} />}
              {i === currentStepIdx && loading && <Loader2 size={11} className="animate-spin" />}
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="text-scout-border" />}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {/* JD Dropzone */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-600 text-scout-text mb-4 flex items-center gap-2">
            <FileText size={16} className="text-scout-accent" />
            Job Description
          </h2>
          <DropZone
            onDrop={onDropJD}
            accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
            label={jdFile ? jdFile.name : 'Drop Job Description here'}
            icon={FileText}
            files={jdFile ? [jdFile] : []}
            color="#6C63FF"
          />
        </div>

        {/* Resume Dropzone */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-600 text-scout-text mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            Candidate Resumes
            {resumeFiles.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                {resumeFiles.length}
              </span>
            )}
          </h2>
          <DropZone
            onDrop={onDropResumes}
            accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
            label="Drop resumes here"
            icon={Users}
            files={resumeFiles}
            maxFiles={50}
            color="#10B981"
          />
          {resumeFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {resumeFiles.map(f => (
                <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-scout-card border border-scout-border">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-scout-muted" />
                    <span className="text-sm text-scout-text">{f.name}</span>
                    <span className="text-xs text-scout-muted font-mono">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button onClick={() => removeResume(f.name)} className="text-scout-muted hover:text-red-400 transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={loading || !jdFile || resumeFiles.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Running Pipeline...</>
          ) : (
            <><Play size={18} fill="currentColor" /> Launch AI Pipeline</>
          )}
        </button>

        {/* Pipeline Log */}
        {pipelineLog.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <h3 className="font-mono text-xs text-scout-muted uppercase tracking-widest mb-3">Pipeline Log</h3>
            <div className="space-y-1.5 font-mono text-xs">
              {pipelineLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-3 ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'muted' ? 'text-scout-muted' :
                  'text-scout-text'
                }`}>
                  <span className="text-scout-border flex-shrink-0">{log.ts}</span>
                  <span>{log.msg}</span>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-scout-accent">
                  <Loader2 size={11} className="animate-spin" />
                  Processing...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}