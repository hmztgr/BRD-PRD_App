import { GoogleGenerativeAI } from '@google/generative-ai'
import { GenerationOptions, GenerationResult } from './openai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function analyzeProjectIdeaWithGemini(options: { projectIdea: string; language: 'en' | 'ar'; uploadedFiles?: string[] }): Promise<{ hasEnoughInfo: boolean; questions?: string[]; extractedInfo?: Record<string, unknown>; confidence: number }> {
  console.log('=== GEMINI ANALYSIS START ===')
  console.log('Project idea:', options.projectIdea)
  console.log('Uploaded files count:', options.uploadedFiles?.length || 0)
  if (options.uploadedFiles && options.uploadedFiles.length > 0) {
    console.log('First file length:', options.uploadedFiles[0].length)
    console.log('First file full content:', options.uploadedFiles[0])
  }
  console.log('===============================')
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const fileContent = options.uploadedFiles?.length ? 
      `\n\nUploaded Files Content:\n${options.uploadedFiles.join('\n\n---\n\n')}` : ''

    const analysisPrompt = options.language === 'ar' ?
      `تحليل فكرة المشروع التالية وتحديد ما إذا كانت المعلومات كافية لإنشاء وثيقة مشروع شاملة:

${options.projectIdea}${fileContent}

يرجى تحليل المعلومات وإرجاع إجابة JSON تحتوي على:
- hasEnoughInfo: true/false (هل المعلومات كافية؟)
- confidence: رقم من 0-100 (مستوى الثقة)
- extractedInfo: معلومات مستخرجة (نوع المشروع، الصناعة، الجمهور المستهدف، الميزات الرئيسية، الأهداف التجارية)
- questions: قائمة بالأسئلة المطلوبة إذا كانت المعلومات غير كافية

أرجع فقط JSON صالح.` :
      `Analyze the following project idea and determine if there's enough information to create comprehensive project documentation:

${options.projectIdea}${fileContent}

Please analyze the information and return a JSON response with:
- hasEnoughInfo: true/false (Is there enough information?)
- confidence: number 0-100 (confidence level)
- extractedInfo: extracted information (project type, industry, target audience, key features, business goals)
- questions: array of specific questions needed if information is insufficient

Return only valid JSON.`

    const result = await model.generateContent(analysisPrompt)
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON, if it fails, extract from markdown code blocks
    let jsonResponse
    try {
      jsonResponse = JSON.parse(text)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not parse response as JSON')
      }
    }
    
    return jsonResponse
  } catch (error) {
    console.error('Gemini analysis failed:', error)
    // Fallback analysis logic
    const wordCount = options.projectIdea.split(' ').length
    const hasFileContent = options.uploadedFiles && options.uploadedFiles.length > 0
    const hasKeywords = /\b(app|website|platform|system|software|service|business|product)\b/i.test(options.projectIdea)
    const hasDetails = /\b(user|customer|feature|function|requirement|goal)\b/i.test(options.projectIdea)
    
    if ((wordCount >= 20 && hasKeywords && hasDetails) || hasFileContent) {
      return {
        hasEnoughInfo: true,
        confidence: hasFileContent ? 85 : 70,
        extractedInfo: {
          projectType: 'software',
          industry: 'technology'
        }
      }
    } else {
      return {
        hasEnoughInfo: false,
        confidence: 30,
        questions: options.language === 'ar' ? [
          'ما هو نوع المشروع بالضبط؟',
          'من هو الجمهور المستهدف؟',
          'ما هي الميزات الأساسية المطلوبة؟',
          'ما هي أهداف العمل الرئيسية؟',
          'ما هي الصناعة أو القطاع؟'
        ] : [
          'What exactly is the type of project?',
          'Who is the target audience?',
          'What are the core features required?',
          'What are the main business objectives?',
          'What industry or sector is this for?'
        ]
      }
    }
  }
}

export async function generateWithGemini(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now()
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const prompt = buildGeminiPrompt(options)
    
    console.log('=== GEMINI GENERATION ===')
    console.log('Prompt length:', prompt.length)
    console.log('Has uploaded files:', !!(options.uploadedFiles && options.uploadedFiles.length > 0))
    console.log('Uploaded files count:', options.uploadedFiles?.length || 0)
    if (options.uploadedFiles && options.uploadedFiles.length > 0) {
      console.log('File content preview:', options.uploadedFiles[0].substring(0, 200))
    }
    console.log('==========================')
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()
    
    // Gemini doesn't provide token usage in the same way, so we estimate
    const tokensUsed = Math.ceil(content.length / 4) // Rough estimate: 1 token ≈ 4 characters
    const generationTime = Date.now() - startTime

    return {
      content,
      tokensUsed,
      generationTime,
      model: 'gemini-1.5-flash'
    }
  } catch (error) {
    console.error('Gemini generation failed:', error)
    throw new Error('Failed to generate document with Gemini')
  }
}

function buildGeminiPrompt(options: GenerationOptions): string {
  const { projectIdea, language, uploadedFiles, additionalInfo } = options

  const systemPrompt = getGeminiSystemPrompt(language)
  
  let userPrompt = language === 'ar' ? 
    `فكرة المشروع:\n${projectIdea}\n\n` :
    `Project Idea:\n${projectIdea}\n\n`

  // Add uploaded files content
  if (uploadedFiles && uploadedFiles.length > 0) {
    userPrompt += language === 'ar' ? 
      `الملفات المرفقة:\n${uploadedFiles.join('\n\n---\n\n')}\n\n` :
      `Uploaded Files:\n${uploadedFiles.join('\n\n---\n\n')}\n\n`
  }

  // Add additional information from answered questions
  if (additionalInfo && Object.keys(additionalInfo).length > 0) {
    userPrompt += language === 'ar' ? 
      `معلومات إضافية:\n` :
      `Additional Information:\n`
    
    Object.entries(additionalInfo).forEach(([question, answer]) => {
      userPrompt += language === 'ar' ? 
        `س: ${question}\nج: ${answer}\n\n` :
        `Q: ${question}\nA: ${answer}\n\n`
    })
  }

  userPrompt += language === 'ar' ?
    `يرجى تحليل هذه الفكرة وإنشاء وثيقة شاملة ومهنية تغطي جميع الجوانب التجارية والتقنية والإدارية للمشروع. استخدم تنسيق markdown مع عناوين واضحة.` :
    `Please analyze this project idea and create a comprehensive professional document covering all business, technical, and management aspects. Use markdown formatting with clear headings.`

  return `${systemPrompt}\n\n${userPrompt}`
}

function getGeminiSystemPrompt(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return `أنت خبير في تحليل المشاريع وكتابة الوثائق التجارية والتقنية باللغة العربية مع خبرة خاصة في السوق السعودي.

مهمتك إنشاء وثيقة شاملة تتضمن:
1. تحليل المشروع وتحديد النوع والصناعة
2. وثيقة متطلبات العمل (BRD) 
3. وثيقة متطلبات المنتج (PRD)
4. المواصفات التقنية والمعمارية
5. خطة إدارة المشروع والجدول الزمني

يجب أن تكون الوثيقة مهنية ومفصلة مع استخدام تنسيق markdown.`
  }

  return `You are an expert business analyst and technical documentation writer.

Your task is to create a comprehensive document that includes:
1. Project analysis and industry identification
2. Business Requirements Document (BRD)
3. Product Requirements Document (PRD) 
4. Technical specifications and architecture
5. Project management plan and timeline

The document should be professional, detailed, and use markdown formatting.`
}