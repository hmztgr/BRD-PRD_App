import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Export the client for use in other modules
export const openaiClient = openai

export interface GenerationOptions {
  projectIdea: string
  language: 'en' | 'ar'
  uploadedFiles?: string[]
  additionalInfo?: Record<string, string> // For answered questions
}

export interface GenerationResult {
  content: string
  tokensUsed: number
  generationTime: number
  model: string
}

export async function analyzeProjectIdea(options: { projectIdea: string; language: 'en' | 'ar'; uploadedFiles?: string[] }): Promise<{ hasEnoughInfo: boolean; questions?: string[]; extractedInfo?: Record<string, unknown>; confidence: number }> {
  try {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: options.language === 'ar' ? 
            "أنت محلل مشاريع خبير. مهمتك تحليل أفكار المشاريع وتحديد ما إذا كانت المعلومات كافية لإنشاء وثائق شاملة." :
            "You are an expert project analyst. Your task is to analyze project ideas and determine if there's sufficient information to create comprehensive documentation."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(response)
  } catch (error) {
    console.error('Project analysis failed:', error)
    // Fallback: assume we need more info
    return {
      hasEnoughInfo: false,
      confidence: 20,
      questions: options.language === 'ar' ? 
        ["ما هو نوع المشروع؟", "من هو الجمهور المستهدف؟", "ما هي الميزات الرئيسية المطلوبة؟"] :
        ["What type of project is this?", "Who is the target audience?", "What are the key features required?"]
    }
  }
}

export async function generateWithOpenAI(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now()
  
  try {
    const prompt = buildPrompt(options)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(options.language)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    })

    const content = completion.choices[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0
    const generationTime = Date.now() - startTime

    return {
      content,
      tokensUsed,
      generationTime,
      model: 'gpt-4o-mini'
    }
  } catch (error) {
    console.error('OpenAI generation failed:', error)
    throw new Error('Failed to generate document with OpenAI')
  }
}

function getSystemPrompt(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return `أنت خبير في تحليل المشاريع وكتابة الوثائق التجارية والتقنية باللغة العربية. تخصصك في السوق السعودي والثقافة العربية.

مهمتك هي تحليل فكرة المشروع المقدمة من المستخدم وإنشاء وثيقة شاملة ومهنية تتضمن:

1. **تحليل المشروع والتوضيح**
   - تحليل فكرة المشروع وتحديد نوعها
   - استخراج الأهداف والمتطلبات الأساسية
   - تحديد الصناعة والسوق المستهدف

2. **وثيقة متطلبات العمل (BRD)**
   - الأهداف التجارية والاستراتيجية
   - تحليل أصحاب المصلحة
   - المتطلبات الوظيفية والغير وظيفية
   - تحليل المخاطر وإدارتها
   - مقاييس النجاح والمؤشرات

3. **وثيقة متطلبات المنتج (PRD)**
   - رؤية المنتج والأهداف
   - الميزات والوظائف المطلوبة
   - تجربة المستخدم ومتطلباتها
   - معايير القبول للميزات

4. **المواصفات التقنية**
   - الهيكل التقني والمعمارية
   - التقنيات والأدوات المقترحة
   - متطلبات الأداء والأمان
   - قاعدة البيانات والتكامل

5. **خطة إدارة المشروع**
   - الجدول الزمني والمراحل
   - توزيع الموارد والميزانية
   - إدارة المخاطر والجودة
   - خطة التطوير والتسليم

يجب أن تكون الوثيقة مهنية ومفصلة مع التركيز على السوق السعودي حيثما كان مناسباً.`
  }

  return `You are an expert business analyst and technical documentation writer specializing in comprehensive project documentation.

Your task is to analyze the user's project idea and create a comprehensive, professional document that includes:

1. **Project Analysis & Clarification**
   - Analyze and understand the project idea
   - Extract core objectives and requirements
   - Identify industry and target market

2. **Business Requirements Document (BRD)**
   - Business objectives and strategic goals
   - Stakeholder analysis and roles
   - Functional and non-functional requirements
   - Risk analysis and mitigation strategies
   - Success metrics and KPIs

3. **Product Requirements Document (PRD)**
   - Product vision and objectives
   - Feature specifications and priorities
   - User experience requirements
   - Acceptance criteria for features

4. **Technical Specifications**
   - System architecture and design
   - Technology stack recommendations
   - Performance and security requirements
   - Database design and integrations

5. **Project Management Plan**
   - Project timeline and milestones
   - Resource allocation and budget estimates
   - Risk management and quality assurance
   - Development and delivery plan

The document should be professional, detailed, and follow industry best practices for business and technical documentation.`
}

function buildPrompt(options: GenerationOptions): string {
  const { projectIdea, language, uploadedFiles, additionalInfo } = options

  let prompt = ''
  
  // Add project idea
  prompt += language === 'ar' ? 
    `فكرة المشروع:\n${projectIdea}\n\n` :
    `Project Idea:\n${projectIdea}\n\n`

  // Add uploaded files content
  if (uploadedFiles && uploadedFiles.length > 0) {
    prompt += language === 'ar' ? 
      `الملفات المرفقة:\n${uploadedFiles.join('\n\n---\n\n')}\n\n` :
      `Uploaded Files:\n${uploadedFiles.join('\n\n---\n\n')}\n\n`
  }

  // Add additional information from answered questions
  if (additionalInfo && Object.keys(additionalInfo).length > 0) {
    prompt += language === 'ar' ? 
      `معلومات إضافية:\n` :
      `Additional Information:\n`
    
    Object.entries(additionalInfo).forEach(([question, answer]) => {
      prompt += language === 'ar' ? 
        `س: ${question}\nج: ${answer}\n\n` :
        `Q: ${question}\nA: ${answer}\n\n`
    })
  }

  // Add final instructions
  if (language === 'ar') {
    prompt += `يرجى إنشاء وثيقة شاملة ومهنية تغطي جميع الجوانب التجارية والتقنية والإدارية للمشروع. يجب أن تكون الوثيقة مفصلة وقابلة للتنفيذ مع التركيز على السوق السعودي والثقافة العربية حيثما كان مناسباً.

استخدم تنسيق markdown للوثيقة مع عناوين واضحة وقوائم منظمة.`
  } else {
    prompt += `Please create a comprehensive professional document covering all business, technical, and management aspects of the project. The document should be detailed, actionable, and follow industry best practices.

Use markdown formatting with clear headings, organized lists, and professional structure. Make the document comprehensive enough to guide the entire project development lifecycle.`
  }

  return prompt
}