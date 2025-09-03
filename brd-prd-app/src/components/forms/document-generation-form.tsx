'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { AlertCircle, CheckCircle, FileText, Zap } from 'lucide-react'

interface DocumentGenerationFormProps {
  onDocumentGenerated?: (documentId: string) => void
}

export function DocumentGenerationForm({ onDocumentGenerated }: DocumentGenerationFormProps) {
  const [formData, setFormData] = useState({
    projectIdea: '',
    language: 'en' as 'en' | 'ar'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [analysisResult, setAnalysisResult] = useState<{
    hasEnoughInfo: boolean
    questions?: string[]
    extractedInfo?: Record<string, unknown>
    confidence: number
  } | null>(null)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({})
  const [generationResult, setGenerationResult] = useState<{
    documentId: string
    tokensUsed: number
    generationTime: number
    model: string
  } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectIdea: formData.projectIdea,
          language: formData.language,
          uploadedFiles,
          additionalInfo: questionAnswers
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate document')
      }

      setGenerationResult(data)
      setSuccess(`Document generated successfully! Used ${data.tokensUsed} tokens in ${Math.round(data.generationTime / 1000)}s`)
      
      if (onDocumentGenerated) {
        onDocumentGenerated(data.documentId)
      }

      // Navigate to the generated document after a brief delay
      setTimeout(() => {
        router.push(`/${formData.language}/documents/${data.documentId}`)
      }, 2000)

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files')
      }

      setUploadedFiles(prev => [...prev, ...data.files])
      setSuccess(`Successfully uploaded ${files.length} file(s)`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to upload files')
    }
  }

  const handleAnalyze = async () => {
    if (!formData.projectIdea.trim()) {
      setError('Please enter your project idea first')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      console.log('=== ANALYSIS REQUEST ===')
      console.log('Project idea:', formData.projectIdea)
      console.log('Uploaded files count:', uploadedFiles.length)
      console.log('Uploaded files preview:', uploadedFiles.map(f => f.substring(0, 100)))
      console.log('========================')
      
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectIdea: formData.projectIdea,
          language: formData.language,
          uploadedFiles
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze project')
      }

      setAnalysisResult(data.analysis)

      if (data.analysis.hasEnoughInfo) {
        setSuccess(`Analysis complete! Confidence: ${data.analysis.confidence}%. Ready to generate document.`)
      } else {
        setSuccess(`Analysis complete! Please answer the questions below to proceed.`)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to analyze project')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Generate New Document
        </CardTitle>
        <CardDescription>
          Use AI to create professional business documents in minutes
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Idea */}
          <div className="space-y-2">
            <Label htmlFor="projectIdea">Describe Your Project Idea *</Label>
            <textarea
              id="projectIdea"
              value={formData.projectIdea}
              onChange={(e) => handleInputChange('projectIdea', e.target.value)}
              placeholder="Tell us about your project idea in detail. For example: 'I want to build an e-commerce platform for selling handmade crafts with features like user registration, product catalog, shopping cart, payment processing, and order management. The target audience is craft enthusiasts and small business owners.'"
              required
              disabled={isGenerating}
              className="w-full min-h-[150px] px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder-gray-400"
            />
            <p className="text-sm text-gray-300">
              Our AI will analyze your idea and ask for clarification if needed before generating comprehensive documentation.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="fileUpload">Upload Supporting Documents (Optional)</Label>
            <input
              id="fileUpload"
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx,.doc"
              onChange={handleFileUpload}
              disabled={isGenerating || isAnalyzing}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
            />
            <p className="text-sm text-gray-300">
              Supported formats: .txt, .md, .pdf, .docx, .doc (Max 10MB per file)
            </p>
            {uploadedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-green-400">
                  {uploadedFiles.length} file(s) uploaded successfully
                </p>
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              disabled={isGenerating || isAnalyzing}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="en">English</option>
              <option value="ar">Arabic (العربية)</option>
            </select>
          </div>

          {/* Analysis Button */}
          <div className="space-y-2">
            <Button 
              type="button"
              onClick={handleAnalyze}
              className="w-full" 
              disabled={isAnalyzing || isGenerating || !formData.projectIdea}
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Project...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Analyze Project Idea
                </>
              )}
            </Button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className={`border rounded-lg p-4 ${
              analysisResult.hasEnoughInfo 
                ? 'bg-gray-900 border-green-500/50 shadow-green-500/20' 
                : 'bg-gray-900 border-yellow-500/50 shadow-yellow-500/20'
            } shadow-lg`}>
              <div className="flex items-center gap-2 mb-2">
                {analysisResult.hasEnoughInfo ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
                <span className={`font-medium ${
                  analysisResult.hasEnoughInfo ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {analysisResult.hasEnoughInfo ? 'Ready to Generate!' : 'Need More Information'}
                </span>
                <span className="text-sm text-gray-400">
                  (Confidence: {analysisResult.confidence}%)
                </span>
              </div>
              
              {!analysisResult.hasEnoughInfo && analysisResult.questions && (
                <div className="space-y-3 mt-4">
                  <p className="text-sm font-medium text-gray-200">Please answer these questions to proceed:</p>
                  {analysisResult.questions.map((question, index) => (
                    <div key={index} className="space-y-1">
                      <Label htmlFor={`question-${index}`} className="text-sm text-gray-200">{question}</Label>
                      <textarea
                        id={`question-${index}`}
                        value={questionAnswers[question] || ''}
                        onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [question]: e.target.value }))}
                        placeholder="Enter your answer..."
                        disabled={isGenerating}
                        className="w-full min-h-[60px] px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Generation Result */}
          {generationResult && (
            <div className="bg-gray-900 border border-green-500/50 rounded-lg p-4 shadow-lg shadow-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="font-medium text-green-300">Generation Complete!</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Model: {generationResult.model}</p>
                <p>Tokens used: {generationResult.tokensUsed}</p>
                <p>Generation time: {Math.round(generationResult.generationTime / 1000)}s</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              isGenerating || 
              !formData.projectIdea || 
              !analysisResult || 
              (!analysisResult.hasEnoughInfo && analysisResult.questions?.some(q => !questionAnswers[q]?.trim()))
            }
          >
            {isGenerating ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Generating Document...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}