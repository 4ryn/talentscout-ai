import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { FileText, Users, Play, CheckCircle, Loader2, X, ChevronRight, Upload as UploadIcon, Sparkles } from 'lucide-react'
import { uploadJD, uploadResumes, runPipeline } from '../api/api'
import toast from 'react-hot-toast'

function DropZone({ onDrop, accept, title, subtitle, icon: Icon, files, maxFiles = 1, color = '#6C63FF', onRemove }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles })

  const hasFiles = files.length > 0

  return (
    <div className="flex flex-col h-full">
      <div
        {...getRootProps()}
        className="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex-shrink-0"
        style={{
          padding: '28px 24px',
          borderColor: isDragActive ? color : hasFiles ? `${color}60` : 'rgba(108,99,255,0.2)',
          background: isDragActive
            ? `${color}0D`
            : hasFiles
            ? `${color}08`
            : 'rgba(10,10,22,0.4)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-6 right-6 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: hasFiles ? `${color}20` : 'rgba(108,99,255,0.08)',
              border: `1px solid ${hasFiles ? color + '40' : 'rgba(108,99,255,0.15)'}`,
              boxShadow: hasFiles ? `0 0 20px ${color}25` : 'none',
            }}>
            {hasFiles
              ? <CheckCircle size={24} style={{ color: '#10B981' }} />
              : <Icon size={24} style={{ color }} />
            }
          </div>

          <div>
            <p className="font-display font-700 text-[#E8E8F0] text-[15px]">
              {isDragActive ? 'Release to drop' : title}
            </p>
            <p className="text-[#6B6B8A] text-xs mt-1">
              {hasFiles
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready`
                : subtitle}
            </p>
          </div>

          {!hasFiles && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}>
              <UploadIcon size={11} />
              Browse files
            </div>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-40">
          {files.map(f => (
            <div key={f.name}
              className="flex items-center justify-between px-3 py-2 rounded-xl border"
              style={{ background: 'rgba(16,16,28,0.7)', borderColor: 'rgba(108,99,255,0.12)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={12} style={{ color: '#6B6B8A', flexShrink: 0 }} />
                <span className="text-xs text-[#E8E8F0] truncate">{f.name}</span>
                <span className="text-[10px] font-mono text-[#6B6B8A] flex-shrink-0">
                  {(f.size / 1024).toFixed(0)}KB
                </span>
              </div>
              {onRemove && (
                <button onClick={e => { e.stopPropagation(); onRemove(f.name) }}
                  className="ml-2 p-0.5 rounded transition-colors hover:text-red-400"
                  style={{ color: '#6B6B8A', flexShrink: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { id: 'jd', label: 'Upload JD', num: '01' },
  { id: 'resumes', label: 'Upload CVs', num: '02' },
  { id: 'run', label: 'Run Pipeline', num: '03' },
  { id: 'done', label: 'View Results', num: '04' },
]

export default function Upload() {
  const navigate = useNavigate()
  const [jdFile, setJdFile] = useState(null)
  const [resumeFiles, setResumeFiles] = useState([])
  const [jobId, setJobId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('idle')
  const [pipelineLog, setPipelineLog] = useState([])

  const addLog = (msg, type = 'info') => {
    setPipelineLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }])
  }

  const onDropJD = useCallback(files => { if (files[0]) setJdFile(files[0]) }, [])
  const onDropResumes = useCallback(files => {
    setResumeFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...files.filter(f => !names.has(f.name))]
    })
  }, [])
  const removeResume = name => setResumeFiles(prev => prev.filter(f => f.name !== name))

  const handleRun = async () => {
    if (!jdFile) return toast.error('Please upload a Job Description first')
    if (resumeFiles.length === 0) return toast.error('Please upload at least one resume')

    setLoading(true)
    setPipelineLog([])

    try {
      setStep('uploading_jd')
      addLog('Uploading Job Description...', 'info')
      const jdRes = await uploadJD(jdFile)
      const jid = jdRes.data.job_id
      setJobId(jid)
      addLog(`✓ JD uploaded — "${jdRes.data.title}"`, 'success')

      setStep('uploading_resumes')
      addLog(`Parsing ${resumeFiles.length} resume(s) with LLM...`, 'info')
      const resumeRes = await uploadResumes(resumeFiles)
      addLog(`✓ ${resumeRes.data.uploaded} candidates indexed in Qdrant`, 'success')

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

  const currentStepIdx = { idle: 0, uploading_jd: 0, uploading_resumes: 1, running: 2, done: 3 }[step] ?? 0
  const accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[11px] font-mono tracking-widest uppercase"
          style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#6C63FF' }}>
          <Sparkles size={10} />
          AI-Powered Screening
        </div>
        <h1 className="font-display font-800 text-[36px] text-[#E8E8F0] mb-2 leading-tight">
          Upload & Launch Pipeline
        </h1>
        <p className="text-[#6B6B8A] text-sm">Provide a job description and resumes to kick off intelligent candidate screening</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: i < currentStepIdx
                  ? 'rgba(16,185,129,0.1)'
                  : i === currentStepIdx
                  ? 'rgba(108,99,255,0.15)'
                  : 'transparent',
                border: i < currentStepIdx
                  ? '1px solid rgba(16,185,129,0.3)'
                  : i === currentStepIdx
                  ? '1px solid rgba(108,99,255,0.35)'
                  : '1px solid transparent',
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-display font-700"
                style={{
                  background: i < currentStepIdx ? '#10B981' : i === currentStepIdx ? '#6C63FF' : 'rgba(107,107,138,0.2)',
                  color: i < currentStepIdx || i === currentStepIdx ? 'white' : '#6B6B8A',
                }}>
                {i < currentStepIdx ? '✓' : s.num}
              </div>
              <span className="text-xs font-medium" style={{
                color: i < currentStepIdx ? '#10B981' : i === currentStepIdx ? '#6C63FF' : '#6B6B8A',
              }}>
                {s.label}
              </span>
              {i === currentStepIdx && loading && <Loader2 size={11} className="animate-spin" style={{ color: '#6C63FF' }} />}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px mx-1" style={{ background: 'rgba(108,99,255,0.15)' }} />
            )}
          </div>
        ))}
      </div>

      {/* HORIZONTAL upload boxes */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Left: JD Upload */}
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(10,10,20,0.7)', borderColor: 'rgba(108,99,255,0.14)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }}>
              <FileText size={14} style={{ color: '#6C63FF' }} />
            </div>
            <div>
              <h2 className="font-display font-700 text-[#E8E8F0] text-sm">Job Description</h2>
              <p className="text-[10px] text-[#6B6B8A]">PDF, DOCX or TXT</p>
            </div>
          </div>
          <DropZone
            onDrop={onDropJD}
            accept={accept}
            title={jdFile ? jdFile.name : 'Drop JD here'}
            subtitle="PDF · DOCX · TXT"
            icon={FileText}
            files={jdFile ? [jdFile] : []}
            color="#6C63FF"
          />
        </div>

        {/* Right: Resume Upload */}
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(10,10,20,0.7)', borderColor: 'rgba(16,185,129,0.14)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Users size={14} style={{ color: '#10B981' }} />
              </div>
              <div>
                <h2 className="font-display font-700 text-[#E8E8F0] text-sm">Candidate Resumes</h2>
                <p className="text-[10px] text-[#6B6B8A]">Multiple files supported</p>
              </div>
            </div>
            {resumeFiles.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                {resumeFiles.length} files
              </span>
            )}
          </div>
          <DropZone
            onDrop={onDropResumes}
            accept={accept}
            title="Drop resumes here"
            subtitle="Batch upload up to 50 files"
            icon={Users}
            files={resumeFiles}
            maxFiles={50}
            color="#10B981"
            onRemove={removeResume}
          />
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={loading || !jdFile || resumeFiles.length === 0}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-700 text-base text-white transition-all mb-6"
        style={{
          background: loading || !jdFile || resumeFiles.length === 0
            ? 'rgba(108,99,255,0.25)'
            : 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
          boxShadow: loading || !jdFile || resumeFiles.length === 0
            ? 'none'
            : '0 8px 32px rgba(108,99,255,0.4)',
          cursor: loading || !jdFile || resumeFiles.length === 0 ? 'not-allowed' : 'pointer',
          opacity: loading || !jdFile || resumeFiles.length === 0 ? 0.6 : 1,
        }}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Running Pipeline...</>
        ) : (
          <><Play size={18} fill="currentColor" /> Launch AI Pipeline</>
        )}
      </button>

      {/* Pipeline Log */}
      {pipelineLog.length > 0 && (
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(8,8,16,0.8)', borderColor: 'rgba(108,99,255,0.12)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
            <h3 className="font-mono text-[11px] text-[#6B6B8A] uppercase tracking-widest">Pipeline Log</h3>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {pipelineLog.map((log, i) => (
              <div key={i} className="flex items-start gap-3" style={{
                color: log.type === 'success' ? '#10B981' :
                  log.type === 'error' ? '#EF4444' :
                  log.type === 'muted' ? '#6B6B8A' :
                  '#E8E8F0',
              }}>
                <span style={{ color: '#252535', flexShrink: 0 }}>{log.ts}</span>
                <span>{log.msg}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2" style={{ color: '#6C63FF' }}>
                <Loader2 size={11} className="animate-spin" />
                Processing...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}