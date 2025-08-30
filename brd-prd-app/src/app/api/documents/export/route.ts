import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, format } = await req.json()

    if (!documentId || !format) {
      return NextResponse.json({ error: 'Document ID and format are required' }, { status: 400 })
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    let buffer: Buffer
    let filename: string
    let contentType: string

    switch (format) {
      case 'docx':
        const docxDoc = await generateDocx(document.content)
        buffer = await Packer.toBuffer(docxDoc)
        filename = `${document.title}.docx`
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break

      case 'pdf':
        // Generate HTML for PDF (will be handled client-side)
        const htmlContent = markdownToHtml(document.content, document.title)
        buffer = Buffer.from(htmlContent, 'utf-8')
        filename = `${document.title}.html`
        contentType = 'text/html'
        break

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(buffer as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export document' }, { status: 500 })
  }
}

async function generateDocx(content: string): Promise<Document> {
  // Parse markdown content and convert to Word document
  const lines = content.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }))
    } else if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1
      }))
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2
      }))
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3
      }))
    } else if (line.startsWith('**') && line.endsWith('**')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.slice(2, -2), bold: true })]
      }))
    } else {
      paragraphs.push(new Paragraph({ text: line }))
    }
  }

  return new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  })
}

// PDF generation now handled client-side via print dialog

function markdownToHtml(markdown: string, title: string): string {
  const html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
          margin-top: 30px;
        }
        h3 {
          color: #7f8c8d;
          margin-top: 25px;
        }
        strong {
          color: #2c3e50;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `
}