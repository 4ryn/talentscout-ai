import axios from 'axios'

const BASE = 'https://talentscout-ai-5p49.onrender.com'

const api = axios.create({
  baseURL: BASE,
  timeout: 300000,
})

export const uploadJD = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload-jd', fd)
}

export const uploadResumes = (files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('files', f))
  return api.post('/upload-resumes', fd)
}

export const runPipeline = (jobId) =>
  api.get(`/run-pipeline?job_id=${jobId}`)

export const getResults = (jobId) =>
  api.get(`/results?job_id=${jobId}`)

export const getJobs = () => api.get('/jobs')

export const getStats = () => api.get('/stats')

export const getPipelineStatus = () => api.get('/pipeline-status')

export const resetSystem = () => api.post('/reset-system')

export default api