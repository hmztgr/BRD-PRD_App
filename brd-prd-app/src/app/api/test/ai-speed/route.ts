import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * AI Speed Test Endpoint
 * 
 * This endpoint runs a simple AI test to verify:
 * 1. Response times are reasonable (not too fast to be fake)
 * 2. Responses are unique and contextual
 * 3. API is working correctly
 */
export async function POST(req: NextRequest) {
  try {
    const { testMessage = "Hello, please tell me about starting a coffee shop in Riyadh." } = await req.json()
    
    console.log('🧪 AI Speed Test Started:', {
      timestamp: new Date().toISOString(),
      testMessage: testMessage.substring(0, 50) + '...'
    })

    // Test multiple responses to check for consistency
    const tests: Array<{
      testName: string
      prompt: string
    }> = [
      {
        testName: 'Simple Business Query',
        prompt: `You are a business consultant. Answer this question: "${testMessage}". Keep your response under 200 words and be specific.`
      },
      {
        testName: 'Contextual Follow-up',
        prompt: `You are a business consultant. The user previously asked: "${testMessage}". Now they ask: "What are the main challenges?" Provide a contextual response under 200 words.`
      },
      {
        testName: 'Arabic Response Test',
        prompt: `أنت مستشار أعمال. أجب على هذا السؤال: "${testMessage}". احتفظ بردك تحت 200 كلمة وكن محدداً.`
      }
    ]

    const testResults = []
    
    for (const test of tests) {
      const testStartTime = Date.now()
      
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        
        console.log(`🚀 Running test: ${test.testName}`)
        
        const geminiStartTime = Date.now()
        const result = await model.generateContent(test.prompt)
        const response = await result.response
        const aiMessage = response.text()
        const geminiEndTime = Date.now()
        
        const testEndTime = Date.now()
        const totalTime = testEndTime - testStartTime
        const geminiTime = geminiEndTime - geminiStartTime
        
        testResults.push({
          testName: test.testName,
          success: true,
          totalTimeMs: totalTime,
          geminiTimeMs: geminiTime,
          responseLength: aiMessage.length,
          responsePreview: aiMessage.substring(0, 100) + '...',
          responseHash: aiMessage.substring(0, 32),
          timestamp: new Date().toISOString(),
          isSuspiciouslyFast: totalTime < 300 || geminiTime < 200,
          isReasonableLength: aiMessage.length > 50 && aiMessage.length < 2000
        })
        
        console.log(`✅ Test "${test.testName}" completed in ${totalTime}ms`)
        
      } catch (error) {
        console.error(`❌ Test "${test.testName}" failed:`, error)
        
        testResults.push({
          testName: test.testName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // Analyze results
    const successfulTests = testResults.filter(t => t.success)
    const averageTime = successfulTests.length > 0 
      ? successfulTests.reduce((sum, test) => sum + (test.totalTimeMs || 0), 0) / successfulTests.length 
      : 0
    const averageGeminiTime = successfulTests.length > 0 
      ? successfulTests.reduce((sum, test) => sum + (test.geminiTimeMs || 0), 0) / successfulTests.length 
      : 0
    
    const analysis = {
      totalTests: tests.length,
      successfulTests: successfulTests.length,
      failedTests: testResults.filter(t => !t.success).length,
      averageTotalTimeMs: Math.round(averageTime),
      averageGeminiTimeMs: Math.round(averageGeminiTime),
      suspiciouslyFastResponses: successfulTests.filter(t => t.isSuspiciouslyFast).length,
      allResponsesUnique: new Set(successfulTests.map(t => t.responseHash)).size === successfulTests.length,
      allResponsesReasonableLength: successfulTests.every(t => t.isReasonableLength),
      overallHealthy: successfulTests.length === tests.length && 
                     averageTime > 500 && 
                     averageGeminiTime > 300 &&
                     new Set(successfulTests.map(t => t.responseHash)).size === successfulTests.length
    }
    
    console.log('📊 AI Speed Test Analysis:', analysis)

    return NextResponse.json({
      success: true,
      testResults,
      analysis,
      recommendations: analysis.overallHealthy ? 
        ['AI system is functioning normally', 'Response times are appropriate', 'Responses are unique and contextual'] :
        [
          ...(analysis.suspiciouslyFastResponses > 0 ? ['⚠️ Some responses are suspiciously fast'] : []),
          ...(analysis.averageTotalTimeMs < 500 ? ['⚠️ Average response time is too fast'] : []),
          ...(!analysis.allResponsesUnique ? ['⚠️ Some responses are not unique'] : []),
          ...(analysis.failedTests > 0 ? ['❌ Some tests failed'] : [])
        ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Speed Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'AI Speed Test',
    description: 'Tests AI response speed and authenticity',
    usage: 'POST with optional testMessage parameter',
    purpose: 'Verify AI responses are genuine and not hardcoded/cached'
  })
}