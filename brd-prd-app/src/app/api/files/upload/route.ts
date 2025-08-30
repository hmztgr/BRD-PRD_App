import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      )
    }

    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]

    const maxFileSize = 10 * 1024 * 1024 // 10MB

    const processedFiles: string[] = []

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        )
      }

      // Check file type
      if (!supportedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported type. Supported types: .txt, .md, .pdf, .docx, .doc` },
          { status: 400 }
        )
      }

      try {
        let content = ''

        if (file.type === 'text/plain' || file.type === 'text/markdown') {
          // Read text files directly
          content = await file.text()
        } else if (file.type === 'application/pdf') {
          // For PDF files, we'd need a PDF parser library
          // For now, just store the file name and indicate it needs processing
          content = `[PDF File: ${file.name}]\nPDF content extraction would require additional processing.\nPlease provide key information from this PDF manually.`
        } else if (file.type.includes('word') || file.type.includes('document')) {
          // For Word documents, we'd need a document parser library
          // For now, just store the file name and indicate it needs processing
          content = `[Word Document: ${file.name}]\nDocument content extraction would require additional processing.\nPlease provide key information from this document manually.`
        }

        processedFiles.push(`File: ${file.name}\nContent:\n${content}`)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        return NextResponse.json(
          { error: `Failed to process file ${file.name}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      files: processedFiles,
      message: `Successfully processed ${files.length} file(s)`
    })

  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}