can you show me the code that affect how the AI model response in my app?


I'll help you find the code that affects how the AI model responds in your app. Let me start by exploring the codebase to understand the structure and locate the relevant AI integration code.

[3 tools called]

Now let me read the complete AI configuration and prompt files to give you a comprehensive view:

[3 tools called]

Based on my analysis of your codebase, here are the key files and code that control how the AI model responds in your app:

## Main AI Response Logic

### 1. **Chat Conversation Handler** (`src/app/api/chat/conversation/route.ts`)

This is where **chat responses** are generated using **Gemini**:

```103:171:brd-prd-app/src/app/api/chat/conversation/route.ts
async function generateAIResponse(messageHistory: Message[], userMessage: string) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Detect if user is writing in Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(userMessage)
    
    // Build conversation context for Gemini
    const conversationContext = messageHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')

    const prompt = isArabic ? 
      `أنت محلل أعمال متخصص في جمع المتطلبات لإنشاء الوثائق المهنية (BRD/PRD).

هدفك: طرح أسئلة مركزة لفهم المشروع بشكل كامل، ثم الإشارة عندما يكون لديك معلومات كافية.

${conversationContext ? `المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم الحالية: ${userMessage}

الإرشادات:
- إذا قال المستخدم "هذا كل شيء" أو "لا يوجد شيء آخر" أو ما شابه، ولديك معلومات أساسية عن المشروع، أجب بـ: "ممتاز! لدي كل المعلومات التي أحتاجها. أنا مستعد لإنشاء وثيقتك المهنية الآن."
- إذا كان لديك معلومات كافية (نوع المشروع، الأهداف، الميزات، المستخدمين)، اسأل إذا كان هناك شيء آخر لإضافته واذكر: "لدي معلومات كافية لإنشاء وثيقة. يمكنك الضغط على زر 'إنشاء الوثيقة' للحصول على وثيقتك، ولكن إذا كان لديك تفاصيل أخرى فسيساعدني ذلك في إنشاء وثيقة أفضل."
- إذا قالوا لا/لا يوجد شيء آخر، أشر إلى أنك مستعد لإنشاء الوثيقة
- كن ودودًا ومفيدًا في المحادثة

يرجى الرد بشكل طبيعي بناءً على سياق المحادثة.
      `You are a business analyst helping to gather requirements for creating professional documents (BRD/PRD). 

Your goal: Ask focused questions to understand the project completely, then indicate when you have enough information.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Current user message: ${userMessage}

Guidelines:
- If the user says "that's everything", "nothing else", "that's all", or similar, AND you have basic project info, respond with: "Perfect! I have all the information I need. I'm ready to generate your professional document now."
- If you have enough info (project type, goals, features, users), ask if there's anything else to add and mention: "I have enough information to generate a document. You can press the 'Generate Document' button to get your document, but if you have more details it would help me create a better document."
- If they say no/nothing else, indicate you're ready to generate the document
- Be conversational and helpful


    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiMessage = response.text()

    // Determine if ready to generate document based on AI response and conversation length
    const conversationLength = messageHistory.length + 1
    const aiIndicatesReady = aiMessage.toLowerCase().includes("ready to generate") || 
                            aiMessage.toLowerCase().includes("i have all the information") ||
                            aiMessage.toLowerCase().includes("enough information") ||
                            aiMessage.includes("مستعد لإنشاء") ||
                            aiMessage.includes("لدي كل المعلومات") ||
                            aiMessage.includes("معلومات كافية")
    const canGenerateDocument = (conversationLength >= 4 && aiIndicatesReady) || conversationLength >= 8

    return {
      message: aiMessage,
      canGenerateDocument
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw error
  }
}
```

### 2. **Document Generation Logic** (`src/lib/ai/index.ts`)

This orchestrates document generation with **failover between OpenAI and Gemini**:

```32:85:brd-prd-app/src/lib/ai/index.ts
export async function generateDocument(
  request: DocumentGenerationRequest,
  preferredProvider: AIProvider = 'openai'
): Promise<DocumentGenerationResponse> {
  // ... token checking logic ...

  // Try generating with preferred provider
  let result: GenerationResult
  try {
    if (preferredProvider === 'openai') {
      result = await generateWithOpenAI(request)
    } else {
      result = await generateWithGemini(request)
    }
  } catch (error) {
    console.error(`${preferredProvider} generation failed, trying fallback:`, error)
    
    // Fallback to the other provider
    const fallbackProvider = preferredProvider === 'openai' ? 'gemini' : 'openai'
    if (fallbackProvider === 'openai') {
      result = await generateWithOpenAI(request)
    } else {
      result = await generateWithGemini(request)
    }
  }
  // ... save to database logic ...
}
```

### 3. **OpenAI Configuration** (`src/lib/ai/openai.ts`)

Key settings for **GPT-4o-mini**:

```86:122:brd-prd-app/src/lib/ai/openai.ts
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
```

**System Prompts** for document generation:

```124:198:brd-prd-app/src/lib/ai/openai.ts
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
```

### 4. **Gemini Configuration** (`src/lib/ai/gemini.ts`)

Key settings for **Gemini 1.5 Flash**:

```104:139:brd-prd-app/src/lib/ai/gemini.ts
export async function generateWithGemini(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now()
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const prompt = buildGeminiPrompt(options)
    
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
```

## Key Configuration Points

1. **Model Selection**:
   - Chat: **Gemini 1.5 Flash** (line 106 in conversation route)
   - Document Generation: **GPT-4o-mini** as primary, **Gemini 1.5 Flash** as fallback

2. **Temperature Settings**:
   - OpenAI: `temperature: 0.7` (line 104 in openai.ts)
   - Gemini: No explicit temperature setting

3. **Token Limits**:
   - OpenAI: `max_tokens: 8000` (line 105 in openai.ts)
   - Gemini: No explicit limit set

4. **Language Detection**:
   - Arabic detection using regex: `/[\u0600-\u06FF\u0750-\u077F]/`
   - Different prompts for Arabic vs English

5. **Failover Logic**:
   - Primary provider attempts first
   - Automatic fallback to secondary provider on failure

To modify AI behavior, you would typically adjust:
- **System prompts** in the `getSystemPrompt()` functions
- **Model parameters** like temperature and max_tokens
- **Model selection** by changing the model names
- **Conversation logic** in the chat response generation