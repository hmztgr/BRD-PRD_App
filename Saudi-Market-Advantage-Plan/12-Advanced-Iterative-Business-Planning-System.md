# Advanced Iterative Business Planning System - Technical Specification

## Executive Summary

This document details the technical implementation of an advanced iterative business planning system that transforms the BRD-PRD app from simple document generation into a comprehensive AI business consultant. The system guides users through complete business planning with country-specific intelligence while maintaining backward compatibility with existing functionality.

## System Architecture Overview

### Core Concept
- **Preserve Existing App**: Simple document generation remains unchanged
- **Add Advanced Mode**: New iterative business planning system as optional enhancement
- **Country-Agnostic Design**: Works for any country with Saudi Arabia as premium intelligence tier
- **Universal Research Assistant**: AI research for any data gathering step in business planning

### User Experience Flow

```
Dashboard → "Create New Document" → Modal Popup
                                 ↓
                    ┌─────────────────┬─────────────────┐
                    │  Simple Mode    │  Advanced Mode  │
                    │  (Current App)  │  (New System)   │
                    └─────────────────┴─────────────────┘
                                 ↓
            Enhanced /documents/new Page with 4 New Sections:
            • Document Upload Area
            • Generated Files Sidebar  
            • Progress Roadmap Tracker
            • Research Findings Panel
```

## Technical Implementation Specification

### 1. Enhanced UI Components for /documents/new Page

#### 1.1 Dashboard Modal Component
```typescript
// src/components/document/GenerationModeModal.tsx
interface GenerationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'simple' | 'advanced') => void;
}

interface GenerationMode {
  id: 'simple' | 'advanced';
  title: string;
  description: string;
  features: string[];
  bestFor: string[];
  isPremium?: boolean;
}

const GenerationModeModal: React.FC<GenerationModeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode
}) => {
  const modes: GenerationMode[] = [
    {
      id: 'simple',
      title: 'Simple Document Generation',
      description: 'Quick document creation with AI assistance',
      features: [
        'Fast document generation',
        'Standard templates',
        'Basic AI assistance',
        'Single document output'
      ],
      bestFor: [
        'Quick project documentation',
        'Standard business documents',
        'Users with clear requirements'
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Business Planning (Beta)',
      description: 'Comprehensive iterative business planning system',
      features: [
        'Iterative planning process',
        'Country-specific intelligence',
        'Research assistance',
        'Multi-document generation',
        'Progress tracking and resume',
        'Saudi Arabia premium intelligence'
      ],
      bestFor: [
        'Business idea development',
        'Comprehensive business planning',
        'Market entry planning',
        'Investment-ready documentation'
      ],
      isPremium: true
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Choose Generation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                mode.isPremium 
                  ? 'border-blue-200 bg-blue-50 hover:border-blue-400' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => onSelectMode(mode.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{mode.title}</h3>
                {mode.isPremium && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{mode.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Best for:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {mode.bestFor.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
```

#### 1.2 Enhanced Chat Interface Layout
```typescript
// src/components/document/EnhancedChatInterface.tsx
interface EnhancedChatInterfaceProps {
  mode: 'simple' | 'advanced';
  onModeChange: (mode: 'simple' | 'advanced') => void;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader mode={mode} onModeChange={onModeChange} />
        <ChatMessages />
        <ChatInput />
      </div>
      
      {/* Enhanced Sidebar - Only in Advanced Mode */}
      {mode === 'advanced' && (
        <div className="w-96 border-l border-gray-200 flex flex-col">
          {/* Document Upload Area */}
          <DocumentUploadZone />
          
          {/* Generated Files Sidebar */}
          <GeneratedFilesSidebar />
          
          {/* Progress Roadmap Tracker */}
          <ProgressRoadmapTracker />
          
          {/* Research Findings Panel */}
          <ResearchFindingsPanel />
        </div>
      )}
    </div>
  );
};
```

#### 1.3 Document Upload Dropzone Component
```typescript
// src/components/document/DocumentUploadZone.tsx
interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
}

const DocumentUploadZone: React.FC = () => {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const uploadedDoc: UploadedDocument = {
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        uploadedAt: new Date(),
        status: 'processing'
      };
      
      setUploadedDocs(prev => [...prev, uploadedDoc]);
      
      try {
        // Process document using document parser service
        const content = await documentParserService.parse(file);
        
        setUploadedDocs(prev => 
          prev.map(doc => 
            doc.id === uploadedDoc.id 
              ? { ...doc, content, status: 'ready' }
              : doc
          )
        );
      } catch (error) {
        setUploadedDocs(prev => 
          prev.map(doc => 
            doc.id === uploadedDoc.id 
              ? { ...doc, status: 'error' }
              : doc
          )
        );
      }
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium mb-2">Upload Documents</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          const files = Array.from(e.dataTransfer.files);
          handleFileUpload(files);
        }}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          id="file-upload"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFileUpload(files);
          }}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-600">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm">Drop files here or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, Text, Images supported
            </p>
          </div>
        </label>
      </div>
      
      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center text-sm">
              <div className="flex-1 truncate">
                {doc.name}
              </div>
              <div className="ml-2">
                {doc.status === 'processing' && <Spinner size="sm" />}
                {doc.status === 'ready' && <span className="text-green-500">✓</span>}
                {doc.status === 'error' && <span className="text-red-500">✗</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2. Advanced Planning Engine

#### 2.1 Universal Research Assistant
```typescript
// src/lib/advanced-planning/research-assistant.ts
interface ResearchRequest {
  type: 'market' | 'regulatory' | 'competitive' | 'technical' | 'financial';
  query: string;
  country: string;
  industry: string;
  context?: string;
}

interface ResearchResult {
  id: string;
  request: ResearchRequest;
  findings: ResearchFinding[];
  sources: ResearchSource[];
  confidence: number;
  completeness: number;
  generatedAt: Date;
  userValidated?: boolean;
  userFeedback?: string;
}

interface ResearchFinding {
  title: string;
  content: string;
  source: string;
  relevance: number;
  category: string;
}

class UniversalResearchAssistant {
  async conductResearch(request: ResearchRequest): Promise<ResearchResult> {
    const researchId = generateId();
    
    // Step 1: Online research using multiple sources
    const webFindings = await this.performWebResearch(request);
    
    // Step 2: Country-specific research if applicable
    const countryFindings = await this.performCountrySpecificResearch(request);
    
    // Step 3: Industry-specific research
    const industryFindings = await this.performIndustryResearch(request);
    
    // Step 4: Combine and analyze findings
    const allFindings = [...webFindings, ...countryFindings, ...industryFindings];
    const analyzedFindings = await this.analyzeFindingsRelevance(allFindings, request);
    
    // Step 5: Calculate confidence and completeness
    const confidence = this.calculateConfidence(analyzedFindings);
    const completeness = this.calculateCompleteness(analyzedFindings, request);
    
    return {
      id: researchId,
      request,
      findings: analyzedFindings,
      sources: this.extractSources(analyzedFindings),
      confidence,
      completeness,
      generatedAt: new Date()
    };
  }
  
  private async performWebResearch(request: ResearchRequest): Promise<ResearchFinding[]> {
    // Use web search APIs (Google Custom Search, Bing, etc.)
    const searchQueries = this.generateSearchQueries(request);
    const findings: ResearchFinding[] = [];
    
    for (const query of searchQueries) {
      const searchResults = await webSearchService.search(query);
      
      for (const result of searchResults) {
        const content = await webScraperService.extractContent(result.url);
        const relevance = await this.calculateRelevance(content, request);
        
        if (relevance > 0.6) {
          findings.push({
            title: result.title,
            content: this.extractRelevantContent(content, request),
            source: result.url,
            relevance,
            category: this.categorizeContent(content, request)
          });
        }
      }
    }
    
    return findings;
  }
  
  private async performCountrySpecificResearch(request: ResearchRequest): Promise<ResearchFinding[]> {
    if (request.country === 'Saudi Arabia') {
      // Use Saudi-Market-Advantage-Plan intelligence
      return await this.getSaudiIntelligence(request);
    } else {
      // Dynamic country research
      return await this.getDynamicCountryIntelligence(request);
    }
  }
  
  async validateWithUser(researchId: string, userFeedback: string): Promise<ResearchResult> {
    const research = await this.getResearch(researchId);
    
    // Analyze user feedback
    const feedbackAnalysis = await aiService.complete(`
      Analyze this user feedback on research findings:
      
      Research Query: ${research.request.query}
      User Feedback: ${userFeedback}
      
      Determine:
      1. Is the research sufficient or are there gaps?
      2. What additional research is needed?
      3. Which findings need clarification?
      4. Overall user satisfaction with research quality
    `);
    
    // Update research with user validation
    const updatedResearch = {
      ...research,
      userValidated: true,
      userFeedback,
      completeness: this.recalculateCompleteness(research, feedbackAnalysis)
    };
    
    await this.saveResearch(updatedResearch);
    return updatedResearch;
  }
  
  async guidedManualResearch(request: ResearchRequest): Promise<ResearchGuidance> {
    const guidance = await aiService.complete(`
      Create a step-by-step research plan for the following:
      
      Research Type: ${request.type}
      Query: ${request.query}
      Country: ${request.country}
      Industry: ${request.industry}
      
      Provide:
      1. Specific sources to check (websites, databases, reports)
      2. Key questions to answer
      3. Data points to collect
      4. Validation methods
      5. Expected timeline for manual research
      
      Format as a numbered action plan.
    `);
    
    return {
      plan: guidance,
      estimatedTime: this.estimateResearchTime(request),
      suggestedSources: this.getSuggestedSources(request),
      keyQuestions: this.generateKeyQuestions(request)
    };
  }
}
```

#### 2.2 Country Intelligence Engine
```typescript
// src/lib/advanced-planning/country-intelligence.ts
interface CountryProfile {
  country: string;
  businessEnvironment: BusinessEnvironment;
  regulations: RegulatoryFramework;
  marketConditions: MarketConditions;
  culturalFactors: CulturealFactors;
  lastUpdated: Date;
}

interface BusinessEnvironment {
  easeOfDoingBusiness: number;
  timeToStartBusiness: number;
  costToStartBusiness: number;
  minimumCapitalRequirement: number;
  taxRate: number;
  laborRegulations: string[];
}

class CountryIntelligenceEngine {
  private saudiIntelligence: SaudiMarketAdvantageSystem;
  
  constructor() {
    this.saudiIntelligence = new SaudiMarketAdvantageSystem();
  }
  
  async getCountryIntelligence(country: string): Promise<CountryProfile> {
    if (country === 'Saudi Arabia') {
      return await this.getSaudiIntelligence();
    } else {
      return await this.getDynamicCountryIntelligence(country);
    }
  }
  
  private async getSaudiIntelligence(): Promise<CountryProfile> {
    // Use expert-curated Saudi intelligence from Saudi-Market-Advantage-Plan
    const regulatoryForecasting = await this.saudiIntelligence.getRegulatoryForecasting();
    const vision2030Opportunities = await this.saudiIntelligence.getVision2030Opportunities();
    const islamicBusinessRequirements = await this.saudiIntelligence.getIslamicBusinessRequirements();
    const governmentPrograms = await this.saudiIntelligence.getGovernmentPrograms();
    
    return {
      country: 'Saudi Arabia',
      businessEnvironment: {
        easeOfDoingBusiness: 62, // World Bank ranking
        timeToStartBusiness: 16, // days
        costToStartBusiness: 4.7, // % of income per capita
        minimumCapitalRequirement: 0,
        taxRate: 20, // corporate tax rate
        laborRegulations: regulatoryForecasting.laborRegulations
      },
      regulations: {
        businessRegistration: regulatoryForecasting.businessRegistration,
        taxRequirements: regulatoryForecasting.taxRequirements,
        industryLicensing: regulatoryForecasting.industryLicensing,
        employmentLaw: regulatoryForecasting.employmentLaw
      },
      marketConditions: {
        gdpGrowth: 3.7,
        inflation: 2.3,
        unemployment: 4.8,
        vision2030Opportunities: vision2030Opportunities,
        governmentPrograms: governmentPrograms
      },
      culturalFactors: {
        islamicCompliance: islamicBusinessRequirements,
        businessCulture: this.saudiIntelligence.getBusinessCulture(),
        languagePreferences: ['Arabic', 'English'],
        workingWeek: 'Sunday to Thursday'
      },
      lastUpdated: new Date()
    };
  }
  
  private async getDynamicCountryIntelligence(country: string): Promise<CountryProfile> {
    // Dynamic research for other countries
    const researchRequests = [
      { type: 'regulatory', query: `business registration requirements ${country}` },
      { type: 'market', query: `market conditions business environment ${country}` },
      { type: 'financial', query: `taxation corporate tax rates ${country}` }
    ];
    
    const researchResults = await Promise.all(
      researchRequests.map(req => 
        this.researchAssistant.conductResearch({ ...req, country, industry: 'general' })
      )
    );
    
    // Synthesize research into country profile
    return await this.synthesizeCountryProfile(country, researchResults);
  }
  
  async generateBusinessPlanningGuidance(
    businessIdea: string, 
    country: string
  ): Promise<BusinessPlanningGuidance> {
    const countryProfile = await this.getCountryIntelligence(country);
    
    const guidance = await aiService.complete(`
      Create comprehensive business planning guidance for:
      
      Business Idea: ${businessIdea}
      Country: ${country}
      
      Country Context:
      - Ease of doing business: ${countryProfile.businessEnvironment.easeOfDoingBusiness}/190
      - Time to start: ${countryProfile.businessEnvironment.timeToStartBusiness} days
      - Corporate tax rate: ${countryProfile.businessEnvironment.taxRate}%
      
      Provide guidance on:
      1. Required documents (BRD, PRD, Case Study, etc.)
      2. Regulatory requirements and timeline
      3. Market entry strategy
      4. Cultural considerations
      5. Funding opportunities
      6. Step-by-step implementation plan
    `);
    
    return {
      requiredDocuments: this.extractRequiredDocuments(guidance),
      regulatoryTimeline: this.extractRegulatoryTimeline(guidance),
      marketEntryStrategy: this.extractMarketStrategy(guidance),
      culturalConsiderations: this.extractCulturalFactors(guidance),
      implementationPlan: this.extractImplementationPlan(guidance),
      countrySpecificFactors: countryProfile
    };
  }
}
```

#### 2.3 Document Planning AI
```typescript
// src/lib/advanced-planning/document-planning.ts
interface BusinessIdea {
  description: string;
  industry: string;
  targetMarket: string;
  businessModel: string;
  stage: 'concept' | 'development' | 'validation' | 'launch';
  complexity: 'simple' | 'moderate' | 'complex';
}

interface DocumentPlan {
  requiredDocuments: RequiredDocument[];
  optionalDocuments: OptionalDocument[];
  documentDependencies: DocumentDependency[];
  estimatedTimeline: Timeline;
  dataRequirements: DataRequirement[];
}

interface RequiredDocument {
  type: 'brd' | 'prd' | 'case_study' | 'market_analysis' | 'technical_spec' | 'financial_plan';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  estimatedEffort: number; // hours
  requiredData: string[];
  template?: string;
}

class DocumentPlanningAI {
  async analyzeBusinessIdea(description: string, country: string): Promise<BusinessIdea> {
    const analysis = await aiService.complete(`
      Analyze this business idea and extract structured information:
      
      Description: ${description}
      Country: ${country}
      
      Extract:
      1. Industry classification
      2. Target market
      3. Business model
      4. Development stage
      5. Complexity level
      
      Return as JSON object with fields: industry, targetMarket, businessModel, stage, complexity
    `);
    
    const parsed = JSON.parse(analysis);
    
    return {
      description,
      industry: parsed.industry,
      targetMarket: parsed.targetMarket,
      businessModel: parsed.businessModel,
      stage: parsed.stage || 'concept',
      complexity: parsed.complexity || 'moderate'
    };
  }
  
  async createDocumentPlan(businessIdea: BusinessIdea, country: string): Promise<DocumentPlan> {
    // Get country-specific intelligence
    const countryIntelligence = await countryIntelligenceEngine.getCountryIntelligence(country);
    
    // Determine required documents based on business idea and country requirements
    const documentAnalysis = await aiService.complete(`
      Create a comprehensive document plan for this business:
      
      Business Details:
      - Description: ${businessIdea.description}
      - Industry: ${businessIdea.industry}
      - Target Market: ${businessIdea.targetMarket}
      - Business Model: ${businessIdea.businessModel}
      - Stage: ${businessIdea.stage}
      - Country: ${country}
      
      Country Requirements:
      - Time to start business: ${countryIntelligence.businessEnvironment.timeToStartBusiness} days
      - Regulatory requirements: Complex
      
      Determine:
      1. What documents are REQUIRED (BRD, PRD, Case Study, Market Analysis, etc.)
      2. What documents are OPTIONAL but recommended
      3. Document creation order and dependencies
      4. Data requirements for each document
      5. Estimated effort for each document
      
      Consider the business complexity and country-specific requirements.
      Format as structured JSON.
    `);
    
    const plan = JSON.parse(documentAnalysis);
    
    return {
      requiredDocuments: plan.requiredDocuments.map(this.mapToRequiredDocument),
      optionalDocuments: plan.optionalDocuments.map(this.mapToOptionalDocument),
      documentDependencies: this.extractDependencies(plan),
      estimatedTimeline: this.calculateTimeline(plan.requiredDocuments),
      dataRequirements: this.extractDataRequirements(plan)
    };
  }
  
  async generateDataCollectionPlan(documentPlan: DocumentPlan): Promise<DataCollectionPlan> {
    const allDataRequirements = documentPlan.dataRequirements;
    
    // Group data requirements by type
    const groupedRequirements = this.groupDataRequirements(allDataRequirements);
    
    // Create collection steps
    const collectionSteps = await Promise.all(
      Object.entries(groupedRequirements).map(async ([type, requirements]) => {
        return await this.createCollectionStep(type, requirements);
      })
    );
    
    return {
      steps: collectionSteps,
      totalEstimatedTime: collectionSteps.reduce((sum, step) => sum + step.estimatedTime, 0),
      researchRequiredSteps: collectionSteps.filter(step => step.requiresResearch),
      userInputSteps: collectionSteps.filter(step => !step.requiresResearch)
    };
  }
  
  private async createCollectionStep(type: string, requirements: DataRequirement[]): Promise<CollectionStep> {
    const stepAnalysis = await aiService.complete(`
      Create a data collection step for:
      Type: ${type}
      Requirements: ${requirements.map(r => r.description).join(', ')}
      
      Determine:
      1. Can this be researched automatically or requires user input?
      2. What research queries would be needed?
      3. What questions should we ask the user?
      4. Estimated time to complete
      5. Step-by-step instructions
    `);
    
    return this.parseCollectionStep(stepAnalysis, type, requirements);
  }
}
```

### 3. Progress Management and Session Handling

#### 3.1 Progress Tracking System
```typescript
// src/lib/advanced-planning/progress-management.ts
interface BusinessPlanningSession {
  id: string;
  userId: string;
  businessIdea: BusinessIdea;
  country: string;
  documentPlan: DocumentPlan;
  currentStep: number;
  completedSteps: CompletedStep[];
  collectedData: CollectedData[];
  generatedDocuments: GeneratedDocument[];
  researchResults: ResearchResult[];
  status: 'in_progress' | 'completed' | 'paused';
  createdAt: Date;
  lastActiveAt: Date;
  estimatedCompletion: Date;
}

interface CompletedStep {
  stepNumber: number;
  stepType: 'research' | 'data_collection' | 'validation' | 'document_generation';
  completedAt: Date;
  data: any;
  userSatisfaction?: number;
}

interface ProgressRoadmap {
  totalSteps: number;
  completedSteps: number;
  currentStep: PlanningStep;
  upcomingSteps: PlanningStep[];
  estimatedTimeRemaining: number;
  overallProgress: number;
}

class ProgressManagementSystem {
  async createSession(
    userId: string, 
    businessDescription: string, 
    country: string
  ): Promise<BusinessPlanningSession> {
    // Analyze business idea
    const businessIdea = await documentPlanningAI.analyzeBusinessIdea(businessDescription, country);
    
    // Create document plan
    const documentPlan = await documentPlanningAI.createDocumentPlan(businessIdea, country);
    
    // Create data collection plan
    const dataCollectionPlan = await documentPlanningAI.generateDataCollectionPlan(documentPlan);
    
    const session: BusinessPlanningSession = {
      id: generateId(),
      userId,
      businessIdea,
      country,
      documentPlan,
      currentStep: 0,
      completedSteps: [],
      collectedData: [],
      generatedDocuments: [],
      researchResults: [],
      status: 'in_progress',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      estimatedCompletion: this.calculateEstimatedCompletion(dataCollectionPlan)
    };
    
    await this.saveSession(session);
    return session;
  }
  
  async getProgressRoadmap(sessionId: string): Promise<ProgressRoadmap> {
    const session = await this.getSession(sessionId);
    
    const planningSteps = await this.generatePlanningSteps(session);
    const completedCount = session.completedSteps.length;
    const totalSteps = planningSteps.length;
    const currentStep = planningSteps[session.currentStep];
    const upcomingSteps = planningSteps.slice(session.currentStep + 1, session.currentStep + 4);
    
    return {
      totalSteps,
      completedSteps: completedCount,
      currentStep,
      upcomingSteps,
      estimatedTimeRemaining: this.calculateRemainingTime(session, planningSteps),
      overallProgress: (completedCount / totalSteps) * 100
    };
  }
  
  async processUserInput(sessionId: string, input: any): Promise<StepResult> {
    const session = await this.getSession(sessionId);
    const planningSteps = await this.generatePlanningSteps(session);
    const currentStep = planningSteps[session.currentStep];
    
    let stepResult: StepResult;
    
    switch (currentStep.type) {
      case 'research':
        stepResult = await this.processResearchStep(session, currentStep, input);
        break;
      case 'data_collection':
        stepResult = await this.processDataCollectionStep(session, currentStep, input);
        break;
      case 'validation':
        stepResult = await this.processValidationStep(session, currentStep, input);
        break;
      case 'document_generation':
        stepResult = await this.processDocumentGenerationStep(session, currentStep, input);
        break;
      default:
        throw new Error(`Unknown step type: ${currentStep.type}`);
    }
    
    // Update session progress
    if (stepResult.completed) {
      session.completedSteps.push({
        stepNumber: session.currentStep,
        stepType: currentStep.type,
        completedAt: new Date(),
        data: stepResult.data,
        userSatisfaction: stepResult.userSatisfaction
      });
      
      session.currentStep += 1;
    }
    
    session.lastActiveAt = new Date();
    await this.saveSession(session);
    
    return stepResult;
  }
  
  private async processResearchStep(
    session: BusinessPlanningSession, 
    step: PlanningStep, 
    userInput: any
  ): Promise<StepResult> {
    if (step.subtype === 'auto_research') {
      // Perform automatic research
      const researchRequest: ResearchRequest = {
        type: step.researchType,
        query: step.researchQuery,
        country: session.country,
        industry: session.businessIdea.industry,
        context: session.businessIdea.description
      };
      
      const researchResult = await universalResearchAssistant.conductResearch(researchRequest);
      
      // Store research result
      session.researchResults.push(researchResult);
      
      return {
        completed: false, // Require user validation
        data: researchResult,
        nextAction: 'user_validation',
        message: `I've researched ${step.title}. Please review the findings and let me know if you need additional information or if this research is sufficient.`
      };
    } else if (step.subtype === 'user_validation') {
      // User validating research results
      const researchResult = session.researchResults.find(r => r.id === userInput.researchId);
      
      if (userInput.approved) {
        return {
          completed: true,
          data: researchResult,
          message: "Great! I'll use this research for the business plan."
        };
      } else {
        // User needs more research
        const guidedResearch = await universalResearchAssistant.guidedManualResearch(researchResult.request);
        
        return {
          completed: false,
          data: guidedResearch,
          nextAction: 'manual_research_guidance',
          message: `I'll help you gather additional information. Here's a research plan you can follow: ${guidedResearch.plan}`
        };
      }
    } else if (step.subtype === 'manual_research_return') {
      // User returning with manual research data
      const validatedResult = await universalResearchAssistant.validateWithUser(
        userInput.researchId, 
        userInput.researchData
      );
      
      // Update stored research
      const index = session.researchResults.findIndex(r => r.id === userInput.researchId);
      session.researchResults[index] = validatedResult;
      
      return {
        completed: true,
        data: validatedResult,
        message: "Perfect! I've incorporated your research findings into the business plan."
      };
    }
  }
  
  async pauseSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    session.status = 'paused';
    session.lastActiveAt = new Date();
    await this.saveSession(session);
  }
  
  async resumeSession(sessionId: string): Promise<BusinessPlanningSession> {
    const session = await this.getSession(sessionId);
    session.status = 'in_progress';
    session.lastActiveAt = new Date();
    await this.saveSession(session);
    return session;
  }
}
```

### 4. Multi-Document Generation System

#### 4.1 Document Generation Pipeline
```typescript
// src/lib/advanced-planning/document-generation.ts
interface DocumentGenerationRequest {
  sessionId: string;
  documentType: string;
  template?: string;
  customRequirements?: string;
}

interface GeneratedDocumentSet {
  documents: GeneratedDocument[];
  relationships: DocumentRelationship[];
  overallQuality: number;
  generationTime: number;
  metadata: GenerationMetadata;
}

class MultiDocumentGenerator {
  async generateDocumentSet(sessionId: string): Promise<GeneratedDocumentSet> {
    const session = await progressManagement.getSession(sessionId);
    
    // Prepare generation context
    const context = await this.prepareGenerationContext(session);
    
    // Generate documents based on document plan
    const documents = await Promise.all(
      session.documentPlan.requiredDocuments.map(docPlan => 
        this.generateDocument(docPlan, context)
      )
    );
    
    // Analyze document relationships and consistency
    const relationships = await this.analyzeDocumentRelationships(documents);
    
    // Calculate overall quality score
    const qualityScore = await this.calculateOverallQuality(documents);
    
    return {
      documents,
      relationships,
      overallQuality: qualityScore,
      generationTime: Date.now() - context.startTime,
      metadata: {
        sessionId,
        generatedAt: new Date(),
        businessIdea: session.businessIdea.description,
        country: session.country,
        totalDataPoints: context.dataPoints.length
      }
    };
  }
  
  private async prepareGenerationContext(session: BusinessPlanningSession): Promise<GenerationContext> {
    // Consolidate all collected data
    const allData = {
      businessIdea: session.businessIdea,
      researchFindings: session.researchResults,
      collectedData: session.collectedData,
      countryIntelligence: await countryIntelligenceEngine.getCountryIntelligence(session.country)
    };
    
    // Create comprehensive context for AI generation
    const context = await aiService.complete(`
      Create a comprehensive business context for document generation:
      
      Business Idea: ${JSON.stringify(session.businessIdea)}
      Research Findings: ${JSON.stringify(session.researchResults.map(r => r.findings))}
      Collected Data: ${JSON.stringify(session.collectedData)}
      Country: ${session.country}
      
      Synthesize all information into a cohesive business context that can be used 
      for generating multiple related documents (BRD, PRD, case studies, etc.).
    `);
    
    return {
      startTime: Date.now(),
      businessContext: context,
      dataPoints: this.extractDataPoints(allData),
      session
    };
  }
  
  private async generateDocument(
    documentPlan: RequiredDocument, 
    context: GenerationContext
  ): Promise<GeneratedDocument> {
    const prompt = this.buildDocumentPrompt(documentPlan, context);
    
    // Generate document content
    const content = await aiService.complete(prompt);
    
    // Validate and enhance document
    const enhancedContent = await this.enhanceDocument(content, documentPlan, context);
    
    return {
      id: generateId(),
      type: documentPlan.type,
      title: documentPlan.title,
      content: enhancedContent,
      wordCount: this.countWords(enhancedContent),
      qualityScore: await this.assessDocumentQuality(enhancedContent, documentPlan),
      generatedAt: new Date(),
      version: 1
    };
  }
  
  private buildDocumentPrompt(documentPlan: RequiredDocument, context: GenerationContext): string {
    const basePrompt = `
      Generate a comprehensive ${documentPlan.type.toUpperCase()} document with the following requirements:
      
      Document Type: ${documentPlan.title}
      Business Context: ${context.businessContext}
      Country Context: ${context.session.country}
      
      Requirements:
      ${documentPlan.requiredData.map(req => `- ${req}`).join('\n')}
      
      The document should be:
      - Professional and comprehensive
      - Tailored to ${context.session.country} market requirements
      - Consistent with other documents in this business plan
      - Include specific data points and research findings
      - Follow industry best practices for ${documentPlan.type}
    `;
    
    // Add country-specific enhancements
    if (context.session.country === 'Saudi Arabia') {
      return basePrompt + this.getSaudiSpecificPromptEnhancements(documentPlan);
    } else {
      return basePrompt + this.getGenericPromptEnhancements(documentPlan, context.session.country);
    }
  }
  
  private getSaudiSpecificPromptEnhancements(documentPlan: RequiredDocument): string {
    return `
      
      Saudi Arabia Specific Requirements:
      - Include Vision 2030 alignment where relevant
      - Address ZATCA compliance requirements
      - Consider Islamic business principles
      - Include cultural and social factors
      - Address government programs and funding opportunities
      - Use Saudi business terminology and context
    `;
  }
}
```

## Database Schema Updates

### Enhanced Session Management Tables
```sql
-- Business planning sessions
CREATE TABLE business_planning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    business_idea JSONB NOT NULL,
    country VARCHAR(100) NOT NULL,
    document_plan JSONB NOT NULL,
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Completed planning steps
CREATE TABLE planning_step_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES business_planning_sessions(id),
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    step_data JSONB,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5)
);

-- Research results
CREATE TABLE research_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES business_planning_sessions(id),
    research_type VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    findings JSONB NOT NULL,
    sources JSONB DEFAULT '[]',
    confidence DECIMAL(3,2) DEFAULT 0.0,
    completeness DECIMAL(3,2) DEFAULT 0.0,
    user_validated BOOLEAN DEFAULT false,
    user_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated documents
CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES business_planning_sessions(id),
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded documents for context
CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES business_planning_sessions(id),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    parsed_content TEXT,
    processing_status VARCHAR(20) DEFAULT 'processing',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Session Management API
```typescript
// POST /api/planning/sessions - Create new planning session
// GET /api/planning/sessions/:id - Get session details
// PUT /api/planning/sessions/:id/step - Process step input
// POST /api/planning/sessions/:id/pause - Pause session
// POST /api/planning/sessions/:id/resume - Resume session
// GET /api/planning/sessions/:id/roadmap - Get progress roadmap
// POST /api/planning/sessions/:id/research - Start research step
// POST /api/planning/sessions/:id/documents/generate - Generate documents
```

### Document Management API
```typescript
// POST /api/planning/documents/upload - Upload supporting documents
// GET /api/planning/documents/:sessionId - Get all session documents
// GET /api/planning/documents/:id/download - Download document
// DELETE /api/planning/documents/:id - Delete document
```

## Integration Points

### Integration with Existing App
1. **Dashboard Enhancement**: Add modal for generation mode selection
2. **Chat Interface**: Enhance existing chat with new sidebar components
3. **User Authentication**: Use existing user system
4. **Subscription System**: Integrate with existing subscription tiers
5. **Document Storage**: Extend existing document management

### Integration with Saudi-Market-Advantage-Plan
1. **Regulatory Intelligence**: Use expert-curated Saudi regulatory knowledge
2. **Vision 2030 Opportunities**: Integrate opportunity matching system
3. **Islamic Business Validation**: Use Sharia compliance checking
4. **Government Programs**: Access funding and support program database
5. **Expert Network**: Leverage established Saudi business expert relationships

## Implementation Timeline

### Phase 1: UI Foundation (1-2 weeks)
- Dashboard modal implementation
- Enhanced chat interface layout
- Document upload component
- Basic progress tracking

### Phase 2: Core Engine (3-4 weeks)
- Universal Research Assistant
- Country Intelligence Engine  
- Document Planning AI
- Progress Management System

### Phase 3: Advanced Features (2-3 weeks)
- Multi-document generation
- Saudi intelligence integration
- Advanced progress tracking
- File management system

### Phase 4: Testing and Launch (1-2 weeks)
- Comprehensive testing
- User acceptance testing
- Performance optimization
- Beta launch preparation

## Success Metrics

### Technical Metrics
- **Research Accuracy**: 85%+ accuracy in automated research
- **Document Quality**: 90%+ user satisfaction with generated documents
- **System Performance**: <5 second response time for research queries
- **Data Completeness**: 80%+ of business plans have complete data

### User Experience Metrics
- **Planning Completion Rate**: 70%+ of started sessions completed
- **User Engagement**: 60+ minutes average session duration
- **Feature Adoption**: 40%+ of users try advanced mode within first month
- **User Satisfaction**: 85%+ satisfaction with advanced planning system

### Business Metrics
- **Conversion Rate**: 25%+ conversion from free to paid plans
- **Premium Feature Usage**: 60%+ of paid users use advanced planning
- **Customer Retention**: 80%+ retention rate for advanced planning users
- **Revenue Impact**: 30%+ revenue increase from advanced features

This comprehensive technical specification provides the foundation for building a sophisticated AI business consultant that transforms the BRD-PRD app into a comprehensive business planning platform while maintaining the existing simple functionality and integrating the expert Saudi market intelligence.