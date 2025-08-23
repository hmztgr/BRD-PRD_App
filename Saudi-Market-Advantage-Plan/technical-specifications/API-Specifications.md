# Saudi Business Planning Intelligence API Specifications

## API Architecture Overview

The Saudi Business Planning Intelligence system provides pre-business advisory APIs that integrate with the existing BRD-PRD application. All APIs focus on business planning assistance, regulatory forecasting, and opportunity identification rather than post-business compliance checking.

### Base URL Structure
```
Production: https://api.brdprdapp.com/saudi-intelligence/v1
Development: http://localhost:3001/saudi-intelligence/v1
```

### Authentication
All APIs use JWT tokens from the main application's authentication system:
```http
Authorization: Bearer <jwt_token>
X-API-Version: 1.0
Content-Type: application/json
```

### Standard Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

## 1. Regulatory Planning Intelligence API

### 1.1 Forecast Regulatory Requirements
**Endpoint**: `POST /regulatory/forecast-requirements`

**Description**: Analyzes planned business data and forecasts regulatory requirements, compliance timelines, and estimated costs for business planning purposes.

**Request Body**:
```typescript
interface RegulatoryForecastRequest {
  plannedBusiness: {
    businessType: string; // 'retail', 'wholesale', 'services', 'manufacturing'
    industry: string;
    projectedAnnualRevenue: number; // in SAR
    plannedStartDate: string; // ISO date
    expectedEmployeeCount: number;
    willHavePhysicalPresence: boolean;
    willProvideServices: boolean;
    willSellGoods: boolean;
    willExportGoods: boolean;
    plannedLocation: {
      city: string;
      region: string;
    };
  };
  forecastOptions?: {
    includeComplianceRoadmap?: boolean; // default: true
    includeCostEstimates?: boolean; // default: true
    includeTimelines?: boolean; // default: true
    includeLicensingSteps?: boolean; // default: true
  };
}
```

**Response**:
```typescript
interface RegulatoryForecastResponse {
  forecastId: string;
  generatedDate: string; // ISO date
  businessPlanSummary: {
    businessType: string;
    projectedRevenue: number;
    planningTimeframe: string;
  };
  
  regulatoryTimeline: {
    preRegistration: {
      timeframe: string; // "2-4 weeks before launch"
      requiredSteps: string[];
      estimatedCost: number;
      criticalPath: boolean;
    };
    businessRegistration: {
      timeframe: string; // "1-2 weeks before launch"
      requiredDocuments: string[];
      estimatedCost: number;
      processingTime: string;
    };
    postLaunch: {
      vatRegistrationTrigger?: {
        revenueThreshold: number;
        timeToComply: string;
        estimatedCost: number;
      };
      ongoingCompliance: {
        monthlyRequirements: string[];
        quarterlyRequirements: string[];
        annualRequirements: string[];
        estimatedMonthlyCost: number;
      };
    };
  };
  
  licenseRequirements: Array<{
    licenseType: string;
    issuingAuthority: string;
    applicationProcess: string[];
    requiredDocuments: string[];
    processingTime: string;
    cost: number;
    renewalPeriod: string;
  }>;
  
  complianceCostForecast: {
    initialSetupCosts: {
      businessRegistration: number;
      requiredLicenses: number;
      legalConsultation: number;
      bankAccountSetup: number;
      total: number;
    };
    ongoingCosts: {
      monthlyBookkeeping: number;
      quarterlyFilings: number;
      annualRenewals: number;
      professionalServices: number;
      monthlyTotal: number;
      annualTotal: number;
    };
  };
  
  businessLaunchRoadmap: Array<{
    phase: string;
    timeline: string;
    milestones: string[];
    dependencies: string[];
    estimatedCost: number;
    criticalPath: boolean;
  }>;
  
  riskAssessment: {
    regulatoryRisks: string[];
    complianceGaps: string[];
    mitigation: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  recommendations: {
    preparationSteps: string[];
    expertConsultation: string[];
    timelineOptimization: string[];
    costOptimization: string[];
  };
}
```

**Example Request**:
```bash
curl -X POST https://api.brdprdapp.com/saudi-advantage/v1/regulatory/zatca/compliance-check \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "businessData": {
      "businessType": "retail",
      "industry": "technology",
      "expectedAnnualRevenue": 500000,
      "startDate": "2024-03-01",
      "employeeCount": 15,
      "hasPhysicalPresence": true,
      "providesServices": true,
      "sellsGoods": true,
      "exportsGoods": false,
      "location": {
        "city": "Riyadh",
        "region": "Central"
      }
    }
  }'
```

### 1.2 Get Business Planning Insights
**Endpoint**: `GET /regulatory/business-planning-insights`

**Query Parameters**:
- `businessType`: string - Filter insights by business type
- `industry`: string - Filter by industry sector
- `projectedRevenue`: number (optional) - Revenue range for targeted insights
- `region`: string (optional) - Geographic region filter

**Response**:
```typescript
interface BusinessPlanningInsightsResponse {
  insights: Array<{
    insightId: string;
    category: 'regulatory' | 'market' | 'funding' | 'compliance';
    title: string;
    summary: string;
    applicableToBusinessTypes: string[];
    impactOnPlanning: 'high' | 'medium' | 'low';
    actionableSteps: string[];
    estimatedImpactOnCosts: number;
    estimatedImpactOnTimeline: string;
    sources: string[];
    lastValidated: string; // ISO date
  }>;
  marketConditions: {
    businessRegistrationTrends: {
      averageProcessingTime: string;
      successRate: number;
      commonDelays: string[];
    };
    regulatoryEnvironment: {
      recentChanges: string[];
      upcomingChanges: string[];
      stabilityIndex: number; // 0-100
    };
  };
  generatedAt: string; // ISO date
  totalInsights: number;
}
```

## 2. Vision 2030 Opportunity Matching API

### 2.1 Match Business Plan to Vision 2030 Opportunities
**Endpoint**: `POST /vision2030/match-opportunities`

**Request Body**:
```typescript
interface Vision2030OpportunityRequest {
  businessPlan: {
    description: string; // Detailed business plan description
    businessModel: string;
    industry: string;
    targetMarket: string;
    expectedInvestment: number;
    plannedLaunchDate: string;
    geographicFocus: string[];
  };
  matchingOptions?: {
    includeStrategicAlignment?: boolean; // default: true
    includeFundingPrograms?: boolean; // default: true
    includeGovernmentPartnerships?: boolean; // default: true
    includeMarketIncentives?: boolean; // default: true
  };
}
```

**Response**:
```typescript
interface Vision2030OpportunityResponse {
  matchingId: string;
  businessPlanId: string;
  analysisDate: string; // ISO date
  
  strategicAlignment: {
    overallScore: number; // 0-100
    confidenceLevel: number; // 0-100
    alignmentCategory: 'strong' | 'moderate' | 'weak' | 'none';
    keyStrengths: string[];
    improvementAreas: string[];
  };
  
  pillarAlignment: {
    economicDiversification: {
      score: number; // 0-100
      matchingInitiatives: string[];
      contributionPotential: 'high' | 'medium' | 'low';
      specificOpportunities: string[];
    };
    thrivingEconomy: {
      score: number;
      jobCreationPotential: number;
      gdpContributionEstimate: number;
      sectorPriority: 'high' | 'medium' | 'low';
    };
    vibrantSociety: {
      score: number;
      socialImpactAreas: string[];
      communityBenefits: string[];
      culturalAlignment: number;
    };
    ambitiousNation: {
      score: number;
      innovationElements: string[];
      technologyAdoption: 'high' | 'medium' | 'low';
      globalCompetitiveness: string[];
    };
  };
  
  fundingOpportunities: Array<{
    programName: string;
    managingEntity: string;
    fundingType: 'grant' | 'loan' | 'investment' | 'guarantee';
    matchScore: number; // 0-100
    eligibilityAssessment: {
      status: 'eligible' | 'likely_eligible' | 'improvements_needed' | 'not_eligible';
      requirementsMet: string[];
      gapsToAddress: string[];
      timeToEligibility: string;
    };
    fundingDetails: {
      minAmount: number;
      maxAmount: number;
      currency: 'SAR';
      fundingDuration: string;
      expectedROI?: string;
    };
    applicationProcess: {
      applicationDeadline?: string; // ISO date
      processingTime: string;
      requiredDocuments: string[];
      keySelectionCriteria: string[];
    };
  }>;
  
  governmentPartnerships: Array<{
    agency: string;
    partnershipType: 'strategic' | 'procurement' | 'regulatory' | 'advisory';
    opportunityDescription: string;
    potentialBenefits: string[];
    engagementProcess: string[];
    contactInformation: {
      department: string;
      email?: string;
      phone?: string;
    };
  }>;
  
  marketIncentives: Array<{
    incentiveType: 'tax' | 'regulatory' | 'infrastructure' | 'talent';
    description: string;
    eligibilityRequirements: string[];
    estimatedValue: {
      amount?: number;
      description: string;
    };
    applicationProcess: string[];
    duration: string;
  }>;
  
  strategicRecommendations: {
    businessModelOptimizations: string[];
    marketPositioning: string[];
    partnershipStrategies: string[];
    implementationPriorities: string[];
  };
  
  nextSteps: {
    immediate: string[]; // Next 30 days
    shortTerm: string[]; // Next 3 months
    longTerm: string[]; // Next 12 months
  };
}
```

### 2.2 Get Vision 2030 KPIs
**Endpoint**: `GET /vision2030/kpis`

**Query Parameters**:
- `pillar`: string (optional) - Filter by pillar name
- `active`: boolean (optional) - Filter active KPIs only

**Response**:
```typescript
interface Vision2030KPIsResponse {
  kpis: Array<{
    id: string;
    name: string;
    nameArabic: string;
    pillar: string;
    currentValue: number;
    target2030: number;
    unit: string;
    progress: number; // percentage
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: string; // ISO date
  }>;
  lastSyncDate: string; // ISO date
}
```

## 3. Islamic Business Planning Validation API

### 3.1 Validate Planned Business for Islamic Compliance
**Endpoint**: `POST /islamic-business/validate-business-plan`

**Request Body**:
```typescript
interface IslamicBusinessPlanValidationRequest {
  plannedBusiness: {
    businessDescription: string;
    proposedBusinessModel: {
      revenueStreams: string[];
      operationalModel: string;
      targetMarket: string;
      plannedPartnerships: string[];
      proposedFinancingStructure: string;
      productServiceOffering: string[];
    };
    businessGoals: string[];
    marketStrategy: string;
  };
  validationOptions?: {
    includeAlternativeModels?: boolean; // default: true
    includeFinancingOptions?: boolean; // default: true
    includeCertificationGuidance?: boolean; // default: true
    includeMarketPositioning?: boolean; // default: true
  };
}
```

**Response**:
```typescript
interface IslamicBusinessPlanValidationResponse {
  validationId: string;
  validationDate: string; // ISO date
  businessPlanSummary: string;
  
  complianceAssessment: {
    overallStatus: 'shariah_compliant' | 'requires_modifications' | 'non_compliant' | 'needs_scholarly_review';
    complianceScore: number; // 0-100
    confidenceLevel: number; // 0-100
    assessmentSummary: string;
  };
  
  businessModelAnalysis: {
    revenueStreamAssessment: Array<{
      revenueStream: string;
      complianceStatus: 'halal' | 'haram' | 'makruh' | 'mubah' | 'uncertain';
      reasoning: string;
      islamicPrinciples: string[];
      modernContext: string;
      recommendations?: string[];
    }>;
    
    operationalModelReview: {
      complianceStatus: 'compliant' | 'requires_adjustments' | 'non_compliant';
      strengths: string[];
      concernsIdentified: string[];
      recommendedModifications: string[];
    };
    
    partnershipGuidance: Array<{
      partnershipType: string;
      islamicConsiderations: string[];
      recommendedStructures: string[];
      cautionaryNotes: string[];
    }>;
  };
  
  financingGuidance: {
    currentStructureAssessment: {
      complianceStatus: 'compliant' | 'non_compliant' | 'needs_review';
      issues: string[];
      recommendations: string[];
    };
    
    islamicFinancingOptions: Array<{
      financingType: 'murabaha' | 'musharakah' | 'mudarabah' | 'ijara' | 'istisna' | 'salam' | 'sukuk';
      suitabilityScore: number; // 0-100
      description: string;
      structuralRequirements: string[];
      businessModelAdaptations: string[];
      estimatedCosts: {
        setupCosts: number;
        ongoingCosts: string;
        comparedToConventional: string; // "5% higher", "equivalent", etc.
      };
      availableProviders: Array<{
        institutionName: string;
        institutionType: 'bank' | 'investment_company' | 'fund';
        specialization: string[];
        contactInfo: string;
        minFundingAmount?: number;
        typicalTerms: string;
      }>;
    }>;
  };
  
  marketPositioning: {
    islamicMarketAdvantages: string[];
    brandingRecommendations: string[];
    targetAudienceInsights: string[];
    competitiveAdvantages: string[];
    marketingConsiderations: string[];
  };
  
  certificationPathway: {
    recommendedCertifications: Array<{
      certificationType: string;
      certifyingBody: string;
      businessBenefits: string[];
      requirements: string[];
      process: string[];
      timeline: string;
      investmentRequired: {
        min: number;
        max: number;
        currency: 'SAR';
      };
      ongoingMaintenance: string;
    }>;
    certificationPriority: 'high' | 'medium' | 'low' | 'optional';
    alternativeValidationMethods: string[];
  };
  
  implementationRoadmap: {
    immediateActions: Array<{
      action: string;
      rationale: string;
      timeline: string;
      estimatedCost?: number;
    }>;
    mediumTermAdjustments: Array<{
      adjustment: string;
      rationale: string;
      timeline: string;
      dependencies: string[];
    }>;
    ongoingCompliance: Array<{
      requirement: string;
      frequency: string;
      responsibleParty: string;
      monitoringMethod: string;
    }>;
  };
  
  expertConsultation: {
    recommendedConsultation: boolean;
    consultationAreas: string[];
    suggestedAuthorities: Array<{
      authorityName: string;
      specialization: string[];
      contactMethod: 'direct' | 'through_platform' | 'referral';
      estimatedCost?: string;
    }>;
  };
  
  alternativeBusinessModels?: Array<{
    modelDescription: string;
    complianceAdvantages: string[];
    implementationComplexity: 'low' | 'medium' | 'high';
    potentialROI: string;
    timeToImplement: string;
  }>;
}
```

## 4. Government Opportunity Discovery API

### 4.1 Discover Relevant Government Programs for Business Planning
**Endpoint**: `POST /government/opportunities/discover`

**Request Body**:
```typescript
interface GovernmentOpportunityDiscoveryRequest {
  plannedBusiness: {
    businessType: string;
    industry: string[];
    plannedSize: 'micro' | 'small' | 'medium' | 'large';
    projectedRevenue: number;
    expectedEmployees: number;
    saudiOwnership: number; // percentage
    plannedLocation: string;
    businessStage: 'idea' | 'planning' | 'pre_launch' | 'early_startup';
    investmentNeeds: {
      totalRequired: number;
      fundingGap: number;
      investmentAreas: string[]; // 'equipment', 'working_capital', 'talent', etc.
    };
  };
  opportunityTypes?: ('funding' | 'support' | 'training' | 'certification' | 'partnerships' | 'market_access')[];
  priorityAreas?: string[]; // Vision 2030 priority sectors
  timeline?: {
    businessLaunch: string; // ISO date
    fundingNeeded: string; // ISO date
  };
}
```

**Response**:
```typescript
interface GovernmentOpportunityDiscoveryResponse {
  discoveryId: string;
  discoveryDate: string; // ISO date
  businessPlanContext: {
    businessType: string;
    projectedRevenue: number;
    businessStage: string;
  };
  
  fundingOpportunities: Array<{
    opportunityId: string;
    programName: string;
    managingAgency: string;
    programCategory: 'startup_funding' | 'sme_support' | 'innovation_grants' | 'sector_specific' | 'export_support';
    
    opportunityMatch: {
      matchScore: number; // 0-100
      matchReasons: string[];
      uniqueAdvantages: string[];
      potentialChallenges: string[];
    };
    
    fundingDetails: {
      fundingType: 'grant' | 'loan' | 'equity_investment' | 'loan_guarantee' | 'convertible_debt';
      amountRange: {
        minimum: number;
        maximum: number;
        currency: 'SAR';
      };
      fundingTerms: {
        repaymentPeriod?: string;
        interestRate?: string;
        equityStake?: string;
        performanceRequirements: string[];
      };
      disbursementSchedule: string;
    };
    
    eligibilityForPlanning: {
      currentStatus: 'eligible' | 'likely_eligible' | 'preparation_needed' | 'not_eligible';
      preparationSteps: Array<{
        step: string;
        timeline: string;
        estimatedCost?: number;
        difficulty: 'low' | 'medium' | 'high';
      }>;
      missingRequirements: string[];
      timeToEligibility: string;
    };
    
    applicationStrategy: {
      optimalApplicationTiming: string;
      requiredPreparation: string[];
      keySuccessFactors: string[];
      competitiveAdvantages: string[];
      applicationDocuments: string[];
      estimatedPreparationTime: string;
    };
    
    programIntelligence: {
      historicalSuccessRate: number; // 0-100
      averageApprovalTime: string;
      typicalFundingDecisions: string;
      recentProgramUpdates: string[];
      applicationDeadlines: {
        next?: string; // ISO date
        frequency: string;
      };
    };
  }>;
  
  supportPrograms: Array<{
    programName: string;
    agency: string;
    supportType: 'incubation' | 'acceleration' | 'mentorship' | 'training' | 'market_access';
    programBenefits: string[];
    eligibilityForCurrentStage: 'eligible' | 'future_opportunity';
    applicationProcess: string[];
    programValue: {
      directValue?: number;
      indirectBenefits: string[];
      networkingOpportunities: string[];
    };
    timeCommitment: string;
    geographicRequirements: string[];
  }>;
  
  partnershipOpportunities: Array<{
    opportunityType: 'government_procurement' | 'public_private_partnership' | 'export_facilitation' | 'research_collaboration';
    description: string;
    partnerAgencies: string[];
    businessRequirements: string[];
    potentialValue: {
      financialImpact: string;
      strategicValue: string[];
    };
    engagementProcess: string[];
    timeToRealization: string;
  }>;
  
  strategicRecommendations: {
    priorityOpportunities: Array<{
      opportunityName: string;
      rationale: string;
      actionPlan: string[];
      timeline: string;
    }>;
    businessPlanOptimizations: string[];
    networkingRecommendations: string[];
    capacityBuildingNeeds: string[];
  };
  
  nextSteps: {
    immediate: Array<{
      action: string;
      deadline: string;
      resources: string[];
    }>;
    preparationPhase: Array<{
      milestone: string;
      timeline: string;
      dependencies: string[];
    }>;
    applicationPhase: Array<{
      opportunity: string;
      timeline: string;
      preparationRequired: string[];
    }>;
  };
  
  totalOpportunityValue: {
    potentialFunding: number;
    nonFinancialValue: string;
    strategicImpact: string;
  };
}
```

### 4.2 Generate Government Application
**Endpoint**: `POST /government/applications/generate`

**Request Body**:
```typescript
interface GovernmentApplicationRequest {
  programId: string;
  businessData: any; // Full business information
  projectData: any; // Project details
  applicationType: 'funding' | 'license' | 'permit' | 'certification';
}
```

**Response**:
```typescript
interface GovernmentApplicationResponse {
  applicationId: string;
  programId: string;
  generatedDocuments: Array<{
    documentType: string;
    filename: string;
    content: string; // Base64 encoded or text
    format: 'pdf' | 'docx' | 'txt';
    language: 'ar' | 'en';
  }>;
  
  submissionInstructions: {
    method: 'online' | 'email' | 'in_person';
    submissionUrl?: string;
    submissionEmail?: string;
    address?: string;
    requiredCopies: number;
    additionalRequirements: string[];
  };
  
  checklistItems: Array<{
    item: string;
    completed: boolean;
    notes?: string;
  }>;
  
  estimatedProcessingTime: string;
  trackingInformation?: {
    referenceNumber: string;
    trackingUrl?: string;
  };
}
```

## 5. Business Planning Intelligence Document Generation API

### 5.1 Generate Intelligence-Enhanced BRD/PRD
**Endpoint**: `POST /documents/generate-with-saudi-intelligence`

**Description**: Generates BRD/PRD documents enhanced with comprehensive Saudi business planning intelligence including regulatory forecasting, Vision 2030 opportunity matching, Islamic business validation, and government opportunity discovery.

**Request Body**:
```typescript
interface BusinessIntelligenceDocumentRequest {
  businessPlan: {
    title: string;
    description: string;
    businessModel: string;
    industry: string;
    targetMarket: string;
    projectedTimeline: string;
    expectedInvestment: number;
    projectedRevenue: number;
    expectedEmployees: number;
    plannedLocation: string;
    teamComposition: string;
    uniqueValueProposition: string;
  };
  
  intelligenceEnhancements: {
    includeRegulatoryForecasting?: boolean; // default: true
    includeVision2030Alignment?: boolean; // default: true
    includeIslamicBusinessValidation?: boolean; // default: true
    includeGovernmentOpportunities?: boolean; // default: true
    includeMarketIntelligence?: boolean; // default: true
    includeComplianceCostEstimation?: boolean; // default: true
  };
  
  documentConfiguration: {
    language: 'ar' | 'en' | 'bilingual';
    outputFormat: 'markdown' | 'html' | 'pdf';
    includeExecutiveSummary: boolean;
    includeBusinessLaunchRoadmap: boolean;
    includeFinancialProjections: boolean;
    includeRiskAssessment: boolean;
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
  };
  
  customizationOptions?: {
    focusAreas?: string[]; // Specific areas to emphasize
    excludeSections?: string[]; // Sections to omit
    additionalContext?: string; // Additional business context
    targetAudience?: 'investors' | 'partners' | 'internal' | 'government';
  };
}
```

**Response**:
```typescript
interface BusinessIntelligenceDocumentResponse {
  documentId: string;
  businessPlanId: string;
  
  generatedDocument: {
    mainDocument: string;
    executiveSummary?: string;
    sections: {
      businessOverview: string;
      marketAnalysis: string;
      businessModel: string;
      implementationPlan: string;
      financialProjections: string;
      riskAssessment?: string;
    };
    
    saudiIntelligenceAppendices: {
      regulatoryForecast?: string;
      vision2030OpportunityAnalysis?: string;
      islamicBusinessValidation?: string;
      governmentOpportunityReport?: string;
      complianceCostAnalysis?: string;
      businessLaunchRoadmap?: string;
    };
  };
  
  intelligenceSummary: {
    regulatoryInsights?: {
      totalComplianceCost: number;
      launchTimeline: string;
      criticalMilestones: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    
    vision2030Analysis?: {
      alignmentScore: number;
      strategicPriority: 'high' | 'medium' | 'low';
      fundingOpportunities: number;
      totalFundingPotential: number;
    };
    
    islamicBusinessAssessment?: {
      complianceStatus: 'compliant' | 'requires_modifications' | 'non_compliant';
      marketAdvantageScore: number;
      financingOptionsAvailable: number;
      certificationRecommended: boolean;
    };
    
    governmentOpportunities?: {
      totalOpportunitiesIdentified: number;
      highPriorityOpportunities: number;
      potentialTotalFunding: number;
      strategicPartnerships: number;
    };
    
    marketIntelligence?: {
      marketMaturityLevel: 'emerging' | 'developing' | 'mature';
      competitionLevel: 'low' | 'medium' | 'high';
      marketOpportunityScore: number;
      recommendedStrategy: string;
    };
  };
  
  actionableInsights: {
    immediateActions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      timeline: string;
      estimatedCost?: number;
      impact: string;
    }>;
    
    strategicRecommendations: Array<{
      recommendation: string;
      rationale: string;
      implementationComplexity: 'low' | 'medium' | 'high';
      expectedROI: string;
    }>;
    
    riskMitigationStrategies: Array<{
      risk: string;
      mitigation: string;
      priority: 'critical' | 'important' | 'monitor';
    }>;
  };
  
  businessPlanOptimizations: {
    strengthsIdentified: string[];
    improvementAreas: string[];
    competitiveAdvantages: string[];
    uniqueSellingPropositions: string[];
  };
  
  documentMetadata: {
    generatedAt: string; // ISO date
    generationDuration: number; // milliseconds
    aiProcessingStats: {
      tokensProcessed: number;
      aiModelsUsed: string[];
      confidenceScores: {
        regulatoryAnalysis?: number;
        vision2030Matching?: number;
        islamicCompliance?: number;
        governmentOpportunities?: number;
      };
    };
    documentVersion: string;
    lastUpdated: string; // ISO date
  };
  
  exportOptions: {
    availableFormats: string[];
    downloadUrls?: {
      pdf?: string;
      docx?: string;
      html?: string;
    };
    shareableLink?: string;
  };
}
```

## 6. System Health and Monitoring API

### 6.1 System Health Check
**Endpoint**: `GET /system/health`

**Response**:
```typescript
interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string; // ISO date
  
  services: {
    zatcaIntegration: {
      status: 'online' | 'offline' | 'degraded';
      lastUpdate: string; // ISO date
      responseTime: number; // milliseconds
    };
    
    vision2030Data: {
      status: 'online' | 'offline' | 'degraded';
      lastSync: string; // ISO date
      kpiCount: number;
    };
    
    islamicAuthorities: {
      status: 'online' | 'offline' | 'degraded';
      availableServices: number;
      lastValidation: string; // ISO date
    };
    
    governmentAPIs: {
      status: 'online' | 'offline' | 'degraded';
      availableEndpoints: number;
      lastCheck: string; // ISO date
    };
  };
  
  performance: {
    avgResponseTime: number; // milliseconds
    successRate: number; // percentage
    errorRate: number; // percentage
  };
  
  uptime: {
    current: number; // seconds
    last24h: number; // percentage
    last7d: number; // percentage
  };
}
```

## Error Handling

### Standard Error Codes
| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid or expired token |
| `AUTH_002` | Insufficient permissions |
| `VAL_001` | Missing required field |
| `VAL_002` | Invalid field format |
| `VAL_003` | Value out of range |
| `ZATCA_001` | ZATCA API unavailable |
| `ZATCA_002` | Invalid business data |
| `VIS_001` | Vision 2030 data sync failed |
| `VIS_002` | Scoring model unavailable |
| `ISL_001` | Islamic authority validation failed |
| `GOV_001` | Government API integration error |
| `SYS_001` | Internal system error |
| `SYS_002` | Service temporarily unavailable |

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      expected?: any;
      received?: any;
      suggestions?: string[];
    };
    documentation?: string; // Link to relevant documentation
  };
  timestamp: string;
  requestId: string;
}
```

## Rate Limiting

All APIs are rate-limited to ensure fair usage:

| Tier | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Free | 100 | 10/minute |
| Professional | 1000 | 50/minute |
| Business | 5000 | 100/minute |
| Enterprise | Unlimited | 500/minute |

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events
- `regulation.updated` - ZATCA regulation changes
- `vision2030.kpi.updated` - Vision 2030 KPI updates
- `islamic.ruling.updated` - New Islamic business rulings
- `government.program.updated` - Government program changes
- `compliance.status.changed` - User compliance status changes

### Webhook Payload Format
```typescript
interface WebhookPayload {
  event: string;
  timestamp: string; // ISO date
  data: any; // Event-specific data
  metadata: {
    userId?: string;
    affectedServices: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

This API specification provides a complete interface for all Saudi Market Advantage features, ensuring consistent integration with the existing BRD-PRD application while providing powerful new capabilities for the Saudi market.