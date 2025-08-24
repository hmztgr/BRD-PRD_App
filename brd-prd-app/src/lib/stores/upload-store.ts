import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  uploadedAt: Date
  processedAt?: Date
  sessionId?: string
  metadata?: {
    pages?: number
    extractedText?: string
    ocrApplied?: boolean
    language?: string
    documentType?: string
  }
  downloadUrl?: string
  previewUrl?: string
  error?: string
}

export interface FileProcessingJob {
  id: string
  fileId: string
  type: 'ocr' | 'text_extraction' | 'analysis'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt?: Date
  completedAt?: Date
  result?: any
  error?: string
}

export interface UploadStore {
  // File management
  files: Record<string, UploadedFile>
  
  // Processing jobs
  processingJobs: Record<string, FileProcessingJob>
  
  // Actions
  addFile: (file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => string
  updateFile: (fileId: string, updates: Partial<UploadedFile>) => void
  deleteFile: (fileId: string) => void
  
  // Processing jobs
  addProcessingJob: (job: Omit<FileProcessingJob, 'id'>) => string
  updateProcessingJob: (jobId: string, updates: Partial<FileProcessingJob>) => void
  deleteProcessingJob: (jobId: string) => void
  
  // Utilities
  getFilesBySession: (sessionId: string) => UploadedFile[]
  getProcessingJobsByFile: (fileId: string) => FileProcessingJob[]
  getActiveUploads: () => UploadedFile[]
  getTotalStorageUsed: () => number
  
  // Batch operations
  deleteFilesBySession: (sessionId: string) => void
  markAllAsProcessed: (sessionId: string) => void
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      files: {},
      processingJobs: {},

      addFile: (file: Omit<UploadedFile, 'id' | 'uploadedAt'>) => {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newFile: UploadedFile = {
          ...file,
          id: fileId,
          uploadedAt: new Date()
        }

        set(state => ({
          files: {
            ...state.files,
            [fileId]: newFile
          }
        }))

        return fileId
      },

      updateFile: (fileId: string, updates: Partial<UploadedFile>) => {
        set(state => ({
          files: {
            ...state.files,
            [fileId]: {
              ...state.files[fileId],
              ...updates,
              ...(updates.status === 'completed' && !state.files[fileId].processedAt 
                ? { processedAt: new Date() } 
                : {}
              )
            }
          }
        }))
      },

      deleteFile: (fileId: string) => {
        set(state => {
          const { [fileId]: deleted, ...remainingFiles } = state.files
          
          // Also delete associated processing jobs
          const remainingJobs = Object.fromEntries(
            Object.entries(state.processingJobs).filter(([_, job]) => job.fileId !== fileId)
          )
          
          return {
            files: remainingFiles,
            processingJobs: remainingJobs
          }
        })
      },

      addProcessingJob: (job: Omit<FileProcessingJob, 'id'>) => {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newJob: FileProcessingJob = {
          ...job,
          id: jobId
        }

        set(state => ({
          processingJobs: {
            ...state.processingJobs,
            [jobId]: newJob
          }
        }))

        return jobId
      },

      updateProcessingJob: (jobId: string, updates: Partial<FileProcessingJob>) => {
        set(state => ({
          processingJobs: {
            ...state.processingJobs,
            [jobId]: {
              ...state.processingJobs[jobId],
              ...updates,
              ...(updates.status === 'processing' && !state.processingJobs[jobId].startedAt
                ? { startedAt: new Date() }
                : {}
              ),
              ...(updates.status === 'completed' || updates.status === 'failed'
                ? { completedAt: new Date() }
                : {}
              )
            }
          }
        }))
      },

      deleteProcessingJob: (jobId: string) => {
        set(state => {
          const { [jobId]: deleted, ...remainingJobs } = state.processingJobs
          return {
            processingJobs: remainingJobs
          }
        })
      },

      getFilesBySession: (sessionId: string): UploadedFile[] => {
        const files = get().files
        return Object.values(files)
          .filter(file => file.sessionId === sessionId)
          .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      },

      getProcessingJobsByFile: (fileId: string): FileProcessingJob[] => {
        const jobs = get().processingJobs
        return Object.values(jobs)
          .filter(job => job.fileId === fileId)
          .sort((a, b) => {
            const aTime = a.startedAt?.getTime() || 0
            const bTime = b.startedAt?.getTime() || 0
            return bTime - aTime
          })
      },

      getActiveUploads: (): UploadedFile[] => {
        const files = get().files
        return Object.values(files).filter(file => 
          file.status === 'uploading' || file.status === 'processing'
        )
      },

      getTotalStorageUsed: (): number => {
        const files = get().files
        return Object.values(files)
          .filter(file => file.status === 'completed')
          .reduce((total, file) => total + file.size, 0)
      },

      deleteFilesBySession: (sessionId: string) => {
        set(state => {
          const filesToDelete = Object.values(state.files)
            .filter(file => file.sessionId === sessionId)
            .map(file => file.id)

          const remainingFiles = Object.fromEntries(
            Object.entries(state.files).filter(([_, file]) => file.sessionId !== sessionId)
          )

          const remainingJobs = Object.fromEntries(
            Object.entries(state.processingJobs).filter(([_, job]) => 
              !filesToDelete.includes(job.fileId)
            )
          )

          return {
            files: remainingFiles,
            processingJobs: remainingJobs
          }
        })
      },

      markAllAsProcessed: (sessionId: string) => {
        set(state => {
          const updatedFiles = { ...state.files }
          
          Object.keys(updatedFiles).forEach(fileId => {
            const file = updatedFiles[fileId]
            if (file.sessionId === sessionId && file.status !== 'completed' && file.status !== 'failed') {
              updatedFiles[fileId] = {
                ...file,
                status: 'completed',
                progress: 100,
                processedAt: new Date()
              }
            }
          })

          return {
            files: updatedFiles
          }
        })
      }
    }),
    {
      name: 'upload-files',
      version: 1
    }
  )
)