# Vision 2030 Opportunity Intelligence Implementation Guide

## Phase 1: Expert-Curated Opportunity Database (Week 1-2)

### 1.1 Environment Setup
```bash
# Create Vision 2030 opportunity intelligence directory
mkdir -p src/lib/saudi-advantage/vision2030/{opportunity-intelligence,funding-matcher,strategic-positioning,expert-validation}
cd src/lib/saudi-advantage/vision2030

# Install required dependencies for opportunity intelligence
npm install openai joi lodash date-fns
npm install --save-dev jest @types/lodash
```

### 1.2 Environment Variables
```typescript
// Add to .env.local and .env.production
# Expert validation settings
VISION2030_EXPERT_NETWORK_API=https://api.yourplatform.com/experts
OPPORTUNITY_UPDATE_INTERVAL=quarterly
FUNDING_PROGRAM_VALIDATION_REQUIRED=true

# AI assistance for opportunity matching
OPPORTUNITY_MATCHING_MODEL=gpt-4
BUSINESS_ANALYSIS_MODEL=gpt-4-turbo

# For development
VISION2030_TEST_MODE=true
MOCK_OPPORTUNITY_DATA=true
```

### 1.3 Database Schema for Vision 2030 Opportunity Intelligence
```sql
-- Vision 2030 opportunity intelligence schema
CREATE SCHEMA IF NOT EXISTS vision2030_opportunities;

-- Core Vision 2030 opportunity areas
CREATE TABLE vision2030_opportunities.opportunity_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    name_arabic VARCHAR(200) NOT NULL,
    description TEXT,
    description_arabic TEXT,
    strategic_importance INTEGER NOT NULL, -- 1-100 scale
    market_size_sar BIGINT, -- Market size in SAR
    current_competition_level VARCHAR(20), -- 'low', 'medium', 'high'
    government_support_level VARCHAR(20), -- 'minimal', 'moderate', 'strong'
    business_types_eligible TEXT[], -- Array of eligible business types
    funding_programs_available TEXT[], -- Array of available funding programs
    expert_validated_by VARCHAR(100), -- Name of expert who validated
    expert_validated_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 1),
    CONSTRAINT valid_color CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- Key Performance Indicators for each pillar
CREATE TABLE vision2030.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES vision2030.pillars(id),
    name VARCHAR(200) NOT NULL,
    name_arabic VARCHAR(200) NOT NULL,
    description TEXT,
    description_arabic TEXT,
    
    -- Current values
    current_value DECIMAL(15,2),
    current_value_date DATE,
    baseline_value DECIMAL(15,2), -- Starting point
    baseline_year INTEGER,
    
    -- 2030 targets
    target_2030 DECIMAL(15,2) NOT NULL,
    intermediate_targets JSONB DEFAULT '{}', -- {"2025": 50, "2027": 75}
    
    -- Metadata
    measurement_unit VARCHAR(50), -- 'percentage', 'millions', 'thousands', 'count'
    measurement_frequency VARCHAR(20) DEFAULT 'annual', -- 'monthly', 'quarterly', 'annual'
    data_source VARCHAR(200),
    calculation_method TEXT,
    
    -- Progress tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0, -- Auto-calculated
    trend VARCHAR(20) DEFAULT 'stable', -- 'improving', 'declining', 'stable'
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT valid_trend CHECK (trend IN ('improving', 'declining', 'stable', 'unknown'))
);

-- Project scoring results
CREATE TABLE vision2030.project_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_description TEXT NOT NULL,
    project_metadata JSONB DEFAULT '{}', -- Additional project info
    
    -- Overall score
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100
    confidence_score DECIMAL(5,2) DEFAULT 50, -- How confident we are in the score
    
    -- Pillar-specific scores
    economic_diversification_score DECIMAL(5,2) DEFAULT 0,
    thriving_economy_score DECIMAL(5,2) DEFAULT 0,
    vibrant_society_score DECIMAL(5,2) DEFAULT 0,
    ambitious_nation_score DECIMAL(5,2) DEFAULT 0,
    
    -- KPI alignment
    aligned_kpis UUID[] DEFAULT '{}', -- Array of KPI IDs
    kpi_contributions JSONB DEFAULT '{}', -- {"kpi_id": contribution_score}
    
    -- Analysis results
    extracted_themes TEXT[] DEFAULT '{}',
    business_sectors TEXT[] DEFAULT '{}',
    innovation_indicators TEXT[] DEFAULT '{}',
    sustainability_indicators TEXT[] DEFAULT '{}',
    social_impact_indicators TEXT[] DEFAULT '{}',
    
    -- Improvement suggestions
    improvement_suggestions JSONB DEFAULT '[]',
    strategic_recommendations JSONB DEFAULT '[]',
    
    -- Scoring metadata
    scoring_model VARCHAR(50) DEFAULT 'gpt-4',
    scoring_version VARCHAR(10) DEFAULT '1.0',
    scoring_duration_ms INTEGER,
    
    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_overall_score CHECK (overall_score >= 0 AND overall_score <= 100),
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 100)
);

-- Funding opportunities matching
CREATE TABLE vision2030.funding_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name VARCHAR(200) NOT NULL,
    program_name_arabic VARCHAR(200),
    agency VARCHAR(200) NOT NULL, -- 'PIF', 'NEOM', 'ROSHN', 'SAAR', etc.
    program_type VARCHAR(50) NOT NULL, -- 'grant', 'loan', 'investment', 'partnership'
    
    -- Eligibility criteria
    min_vision_score INTEGER DEFAULT 0, -- Minimum Vision 2030 alignment score
    required_pillars TEXT[] DEFAULT '{}', -- Required pillar alignment
    sector_focus TEXT[] DEFAULT '{}', -- Target sectors
    business_stage TEXT[] DEFAULT '{}', -- 'startup', 'growth', 'mature'
    min_funding_amount DECIMAL(15,2),
    max_funding_amount DECIMAL(15,2),
    
    -- Program details
    funding_currency VARCHAR(3) DEFAULT 'SAR',
    application_deadline DATE,
    program_duration_months INTEGER,
    success_rate DECIMAL(5,2), -- Historical success rate
    
    -- Contact and application info
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    application_url VARCHAR(500),
    application_process JSONB DEFAULT '[]', -- Step-by-step process
    required_documents TEXT[] DEFAULT '{}',
    
    -- Program status
    is_active BOOLEAN DEFAULT true,
    applications_open BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_program_type CHECK (program_type IN ('grant', 'loan', 'investment', 'partnership', 'incubation'))
);

-- Project-funding matching results
CREATE TABLE vision2030.funding_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_score_id UUID NOT NULL REFERENCES vision2030.project_scores(id),
    funding_program_id UUID NOT NULL REFERENCES vision2030.funding_programs(id),
    
    match_score DECIMAL(5,2) NOT NULL, -- How well project matches program
    eligibility_status VARCHAR(20) DEFAULT 'eligible', -- 'eligible', 'partial', 'not_eligible'
    
    -- Match analysis
    matching_criteria JSONB DEFAULT '{}',
    missing_requirements TEXT[] DEFAULT '{}',
    improvement_suggestions TEXT[] DEFAULT '{}',
    
    -- Application tracking
    application_generated BOOLEAN DEFAULT false,
    application_submitted BOOLEAN DEFAULT false,
    application_status VARCHAR(50), -- 'draft', 'submitted', 'under_review', 'approved', 'rejected'
    
    estimated_approval_chance DECIMAL(5,2), -- 0-100
    estimated_funding_amount DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_match_score CHECK (match_score >= 0 AND match_score <= 100),
    CONSTRAINT valid_eligibility CHECK (eligibility_status IN ('eligible', 'partial', 'not_eligible'))
);

-- Vision 2030 data updates tracking
CREATE TABLE vision2030.data_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_type VARCHAR(50) NOT NULL, -- 'kpi_value', 'new_program', 'target_change'
    source VARCHAR(100) NOT NULL, -- 'opendata_api', 'website_scraper', 'manual'
    
    -- Update content
    entity_type VARCHAR(50), -- 'kpi', 'program', 'target'
    entity_id UUID, -- References the updated entity
    old_value JSONB,
    new_value JSONB,
    
    update_summary TEXT,
    impact_assessment TEXT,
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    requires_manual_review BOOLEAN DEFAULT false,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    CONSTRAINT valid_update_type CHECK (update_type IN ('kpi_value', 'new_program', 'target_change', 'pillar_update'))
);

-- Indexes for performance
CREATE INDEX idx_kpis_pillar ON vision2030.kpis(pillar_id);
CREATE INDEX idx_kpis_active ON vision2030.kpis(is_active);
CREATE INDEX idx_project_scores_user ON vision2030.project_scores(user_id);
CREATE INDEX idx_project_scores_overall ON vision2030.project_scores(overall_score DESC);
CREATE INDEX idx_funding_programs_active ON vision2030.funding_programs(is_active, applications_open);
CREATE INDEX idx_funding_matches_project ON vision2030.funding_matches(project_score_id);
CREATE INDEX idx_funding_matches_score ON vision2030.funding_matches(match_score DESC);

-- Sample data insertion
INSERT INTO vision2030.pillars (name, name_arabic, description, weight, color_hex) VALUES
('Economic Diversification', 'التنويع الاقتصادي', 'Diversifying the economy and reducing dependence on oil', 0.30, '#1E3A8A'),
('Thriving Economy', 'اقتصاد مزدهر', 'Creating a thriving economy that provides opportunities for all', 0.25, '#059669'),
('Vibrant Society', 'مجتمع حيوي', 'Building a vibrant society where citizens can fulfill their dreams', 0.25, '#DC2626'),
('Ambitious Nation', 'وطن طموح', 'An ambitious nation with effective government and strong partnerships', 0.20, '#7C2D12');
```

## Phase 2: Data Integration (Week 3-4)

### 2.1 Saudi Open Data Portal Integration
```typescript
// src/lib/saudi-advantage/vision2030/data-integration/vision-api.ts
import axios, { AxiosInstance } from 'axios';
import { createLogger } from 'winston';
import { Redis } from 'ioredis';

interface OpenDataKPI {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  current_value: number;
  unit: string;
  target_2030: number;
  last_updated: string;
  pillar: string;
  data_source: string;
}

interface Vision2030ApiResponse {
  success: boolean;
  data: {
    kpis: OpenDataKPI[];
    last_updated: string;
    total_count: number;
  };
}

export class Vision2030DataIntegrator {
  private client: AxiosInstance;
  private redis: Redis;
  private logger = createLogger({
    service: 'vision2030-data-integrator',
    level: 'info'
  });

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SAUDI_OPENDATA_API_URL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${process.env.SAUDI_OPENDATA_TOKEN}`,
        'Accept': 'application/json',
        'User-Agent': 'BRD-PRD-App-Vision2030/1.0'
      }
    });

    this.redis = new Redis(process.env.REDIS_URL);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        this.logger.info('Vision 2030 API Request', { 
          url: config.url, 
          method: config.method 
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.info('Vision 2030 API Response', { 
          status: response.status, 
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        this.logger.error('Vision 2030 API Error', { 
          status: error.response?.status,
          message: error.message 
        });
        return Promise.reject(error);
      }
    );
  }

  async fetchLatestKPIs(): Promise<OpenDataKPI[]> {
    try {
      // Check cache first
      const cacheKey = 'vision2030:kpis:latest';
      const cached = await this.redis.get(cacheKey);
      
      if (cached && process.env.NODE_ENV === 'production') {
        this.logger.info('Returning cached Vision 2030 KPIs');
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<Vision2030ApiResponse>('/datasets/vision-2030-kpis');
      
      if (!response.data.success) {
        throw new Error('API returned unsuccessful response');
      }

      const kpis = response.data.data.kpis;
      
      // Cache the results
      await this.redis.setex(cacheKey, 3600, JSON.stringify(kpis)); // 1 hour cache
      
      this.logger.info(`Fetched ${kpis.length} KPIs from Vision 2030 API`);
      return kpis;
      
    } catch (error) {
      this.logger.error('Failed to fetch Vision 2030 KPIs from API', { error });
      
      // Fallback to scraping
      return this.fallbackToScraping();
    }
  }

  private async fallbackToScraping(): Promise<OpenDataKPI[]> {
    this.logger.info('Falling back to web scraping for Vision 2030 data');
    
    try {
      const scraper = new Vision2030WebScraper();
      return await scraper.scrapeKPIs();
    } catch (error) {
      this.logger.error('Scraping also failed, returning mock data', { error });
      return this.getMockKPIs();
    }
  }

  private getMockKPIs(): OpenDataKPI[] {
    // Mock data for development and fallback
    return [
      {
        id: 'non-oil-gdp-contribution',
        title: 'Non-oil GDP contribution',
        title_ar: 'مساهمة الناتج المحلي الإجمالي غير النفطي',
        description: 'Percentage of GDP from non-oil sectors',
        description_ar: 'نسبة الناتج المحلي الإجمالي من القطاعات غير النفطية',
        current_value: 50,
        unit: 'percentage',
        target_2030: 65,
        last_updated: new Date().toISOString(),
        pillar: 'Economic Diversification',
        data_source: 'Ministry of Economy and Planning'
      },
      {
        id: 'sme-contribution-gdp',
        title: 'SME contribution to GDP',
        title_ar: 'مساهمة المنشآت الصغيرة والمتوسطة في الناتج المحلي',
        description: 'Small and medium enterprises contribution to GDP',
        description_ar: 'مساهمة المنشآت الصغيرة والمتوسطة في الناتج المحلي الإجمالي',
        current_value: 20,
        unit: 'percentage',
        target_2030: 35,
        last_updated: new Date().toISOString(),
        pillar: 'Thriving Economy',
        data_source: 'Monsha\'at'
      },
      {
        id: 'women-labor-participation',
        title: 'Women labor force participation',
        title_ar: 'مشاركة المرأة في القوى العاملة',
        description: 'Percentage of women participating in the labor force',
        description_ar: 'نسبة مشاركة المرأة في القوى العاملة',
        current_value: 35,
        unit: 'percentage',
        target_2030: 30,
        last_updated: new Date().toISOString(),
        pillar: 'Vibrant Society',
        data_source: 'Ministry of Human Resources'
      }
      // Add more mock KPIs...
    ];
  }

  async syncKPIsToDatabase(): Promise<void> {
    try {
      const apiKPIs = await this.fetchLatestKPIs();
      
      for (const apiKPI of apiKPIs) {
        await this.upsertKPI(apiKPI);
      }
      
      this.logger.info(`Synchronized ${apiKPIs.length} KPIs to database`);
    } catch (error) {
      this.logger.error('Failed to sync KPIs to database', { error });
      throw error;
    }
  }

  private async upsertKPI(apiKPI: OpenDataKPI): Promise<void> {
    const { prisma } = require('@/lib/prisma');
    
    // Find the pillar
    const pillar = await prisma.vision2030_pillars.findFirst({
      where: { name: apiKPI.pillar }
    });
    
    if (!pillar) {
      this.logger.warn(`Pillar not found: ${apiKPI.pillar}`);
      return;
    }

    // Calculate progress percentage
    const progressPercentage = this.calculateProgress(
      apiKPI.current_value, 
      apiKPI.target_2030,
      0 // Assume baseline is 0 for now
    );

    // Upsert KPI
    await prisma.vision2030_kpis.upsert({
      where: { name: apiKPI.title },
      update: {
        current_value: apiKPI.current_value,
        current_value_date: new Date(apiKPI.last_updated),
        progress_percentage: progressPercentage,
        last_updated: new Date(),
        data_source: apiKPI.data_source
      },
      create: {
        pillar_id: pillar.id,
        name: apiKPI.title,
        name_arabic: apiKPI.title_ar,
        description: apiKPI.description,
        description_arabic: apiKPI.description_ar,
        current_value: apiKPI.current_value,
        current_value_date: new Date(apiKPI.last_updated),
        target_2030: apiKPI.target_2030,
        measurement_unit: apiKPI.unit,
        progress_percentage: progressPercentage,
        data_source: apiKPI.data_source,
        baseline_value: 0, // Will be updated manually
        baseline_year: 2016
      }
    });
  }

  private calculateProgress(current: number, target: number, baseline: number): number {
    if (target === baseline) return 100; // Avoid division by zero
    
    const progress = ((current - baseline) / (target - baseline)) * 100;
    return Math.max(0, Math.min(100, progress)); // Clamp between 0-100
  }
}

// Web scraper fallback
class Vision2030WebScraper {
  async scrapeKPIs(): Promise<OpenDataKPI[]> {
    // Implementation for scraping Vision 2030 website
    // This is a fallback when API is not available
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    try {
      const response = await axios.get('https://www.vision2030.gov.sa/en/explore/programs');
      const $ = cheerio.load(response.data);
      
      const kpis: OpenDataKPI[] = [];
      
      // Scrape KPI data from the website
      $('.kpi-item').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.kpi-title').text().trim();
        const currentValue = parseFloat($el.find('.kpi-current').text().replace(/[^\d.]/g, ''));
        const target = parseFloat($el.find('.kpi-target').text().replace(/[^\d.]/g, ''));
        
        if (title && !isNaN(currentValue) && !isNaN(target)) {
          kpis.push({
            id: title.toLowerCase().replace(/\s+/g, '-'),
            title: title,
            title_ar: title, // Would need translation
            description: $el.find('.kpi-description').text().trim(),
            description_ar: $el.find('.kpi-description').text().trim(),
            current_value: currentValue,
            unit: 'percentage', // Would need to parse unit
            target_2030: target,
            last_updated: new Date().toISOString(),
            pillar: 'Economic Diversification', // Would need to determine pillar
            data_source: 'vision2030.gov.sa'
          });
        }
      });
      
      return kpis;
    } catch (error) {
      console.error('Web scraping failed:', error);
      return [];
    }
  }
}

export default Vision2030DataIntegrator;
```

### 2.2 NLP-Powered Project Analysis
```typescript
// src/lib/saudi-advantage/vision2030/scoring-engine/nlp-analyzer.ts
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import natural from 'natural';
import compromise from 'compromise';

interface ProjectTheme {
  theme: string;
  confidence: number;
  keywords: string[];
  category: 'technology' | 'sustainability' | 'social' | 'economic' | 'innovation';
}

interface BusinessSector {
  sector: string;
  confidence: number;
  subsectors: string[];
}

interface ExtractedInsights {
  themes: ProjectTheme[];
  businessSectors: BusinessSector[];
  innovationLevel: 'low' | 'medium' | 'high';
  sustainabilityFocus: boolean;
  socialImpact: 'low' | 'medium' | 'high';
  economicImpact: 'low' | 'medium' | 'high';
  digitalTransformation: boolean;
  jobCreationPotential: number; // Estimated jobs
  investmentRequired: string; // Estimated range
  implementationComplexity: 'low' | 'medium' | 'high';
}

export class ProjectNLPAnalyzer {
  private openai?: OpenAI;
  private gemini?: any;
  private tokenizer: any;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    this.tokenizer = natural.WordTokenizer;
  }

  async analyzeProject(description: string): Promise<ExtractedInsights> {
    try {
      // Use AI model for analysis
      if (this.openai) {
        return await this.analyzeWithOpenAI(description);
      } else if (this.gemini) {
        return await this.analyzeWithGemini(description);
      } else {
        // Fallback to rule-based analysis
        return this.analyzeWithRules(description);
      }
    } catch (error) {
      console.error('NLP analysis failed, using fallback:', error);
      return this.analyzeWithRules(description);
    }
  }

  private async analyzeWithOpenAI(description: string): Promise<ExtractedInsights> {
    const prompt = `
Analyze this business project description and extract key insights for Saudi Vision 2030 alignment:

Project Description: "${description}"

Please analyze and return a JSON object with the following structure:
{
  "themes": [
    {
      "theme": "theme name",
      "confidence": 0.85,
      "keywords": ["keyword1", "keyword2"],
      "category": "technology|sustainability|social|economic|innovation"
    }
  ],
  "businessSectors": [
    {
      "sector": "sector name",
      "confidence": 0.90,
      "subsectors": ["subsector1", "subsector2"]
    }
  ],
  "innovationLevel": "low|medium|high",
  "sustainabilityFocus": true/false,
  "socialImpact": "low|medium|high",
  "economicImpact": "low|medium|high",
  "digitalTransformation": true/false,
  "jobCreationPotential": 0,
  "investmentRequired": "low|medium|high",
  "implementationComplexity": "low|medium|high"
}

Focus on Saudi Arabia context and Vision 2030 strategic priorities. Return only valid JSON.
`;

    const response = await this.openai!.chat.completions.create({
      model: process.env.VISION2030_SCORING_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return this.analyzeWithRules(description);
    }
  }

  private async analyzeWithGemini(description: string): Promise<ExtractedInsights> {
    const prompt = `
Analyze this business project for Saudi Vision 2030 alignment and return structured JSON data:

Project: "${description}"

Return analysis as JSON with themes, business sectors, innovation level, sustainability focus, social impact, economic impact, digital transformation indicators, job creation potential, investment requirements, and implementation complexity.

Focus on Saudi market context and Vision 2030 strategic goals.
`;

    const result = await this.gemini.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Gemini response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return this.analyzeWithRules(description);
    }
  }

  private analyzeWithRules(description: string): ExtractedInsights {
    const text = description.toLowerCase();
    const doc = compromise(description);
    
    // Extract themes using keyword matching
    const themes = this.extractThemes(text);
    
    // Extract business sectors
    const businessSectors = this.extractBusinessSectors(text);
    
    // Assess innovation level
    const innovationLevel = this.assessInnovationLevel(text);
    
    // Check sustainability focus
    const sustainabilityFocus = this.checkSustainabilityFocus(text);
    
    // Assess impacts
    const socialImpact = this.assessSocialImpact(text);
    const economicImpact = this.assessEconomicImpact(text);
    
    // Check digital transformation
    const digitalTransformation = this.checkDigitalTransformation(text);
    
    // Estimate job creation
    const jobCreationPotential = this.estimateJobCreation(text, businessSectors);
    
    // Estimate investment
    const investmentRequired = this.estimateInvestment(text);
    
    // Assess complexity
    const implementationComplexity = this.assessComplexity(text);

    return {
      themes,
      businessSectors,
      innovationLevel,
      sustainabilityFocus,
      socialImpact,
      economicImpact,
      digitalTransformation,
      jobCreationPotential,
      investmentRequired,
      implementationComplexity
    };
  }

  private extractThemes(text: string): ProjectTheme[] {
    const themePatterns = {
      'Digital Transformation': {
        keywords: ['digital', 'technology', 'AI', 'artificial intelligence', 'automation', 'software', 'app', 'platform', 'online'],
        category: 'technology' as const
      },
      'Sustainability': {
        keywords: ['sustainable', 'green', 'renewable', 'environment', 'eco', 'clean energy', 'solar', 'wind'],
        category: 'sustainability' as const
      },
      'Innovation': {
        keywords: ['innovative', 'new', 'revolutionary', 'breakthrough', 'cutting-edge', 'advanced'],
        category: 'innovation' as const
      },
      'Economic Development': {
        keywords: ['economy', 'economic', 'business', 'commerce', 'trade', 'market', 'revenue', 'profit'],
        category: 'economic' as const
      },
      'Social Impact': {
        keywords: ['social', 'community', 'people', 'society', 'education', 'healthcare', 'welfare'],
        category: 'social' as const
      }
    };

    const themes: ProjectTheme[] = [];
    
    for (const [themeName, pattern] of Object.entries(themePatterns)) {
      let matchCount = 0;
      const foundKeywords: string[] = [];
      
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          matchCount++;
          foundKeywords.push(keyword);
        }
      }
      
      if (matchCount > 0) {
        const confidence = Math.min(matchCount / pattern.keywords.length * 2, 1); // Cap at 1.0
        
        themes.push({
          theme: themeName,
          confidence: Math.round(confidence * 100) / 100,
          keywords: foundKeywords,
          category: pattern.category
        });
      }
    }
    
    return themes.sort((a, b) => b.confidence - a.confidence);
  }

  private extractBusinessSectors(text: string): BusinessSector[] {
    const sectorPatterns = {
      'Technology': {
        keywords: ['software', 'tech', 'IT', 'digital', 'AI', 'data', 'analytics', 'cybersecurity'],
        subsectors: ['Software Development', 'Cybersecurity', 'Data Analytics', 'AI/ML']
      },
      'Healthcare': {
        keywords: ['health', 'medical', 'hospital', 'clinic', 'pharma', 'medicine', 'treatment'],
        subsectors: ['Medical Services', 'Pharmaceuticals', 'Medical Technology', 'Telemedicine']
      },
      'Education': {
        keywords: ['education', 'learning', 'school', 'university', 'training', 'teaching', 'course'],
        subsectors: ['Higher Education', 'Vocational Training', 'Online Learning', 'EdTech']
      },
      'Financial Services': {
        keywords: ['finance', 'bank', 'fintech', 'payment', 'investment', 'insurance', 'trading'],
        subsectors: ['Banking', 'Investment', 'Insurance', 'Fintech']
      },
      'Manufacturing': {
        keywords: ['manufacturing', 'production', 'factory', 'industrial', 'assembly', 'processing'],
        subsectors: ['Industrial Manufacturing', 'Food Processing', 'Textiles', 'Chemicals']
      },
      'Tourism': {
        keywords: ['tourism', 'travel', 'hotel', 'hospitality', 'entertainment', 'leisure', 'cultural'],
        subsectors: ['Hospitality', 'Entertainment', 'Cultural Tourism', 'Adventure Tourism']
      },
      'Energy': {
        keywords: ['energy', 'oil', 'gas', 'renewable', 'solar', 'wind', 'nuclear', 'electricity'],
        subsectors: ['Renewable Energy', 'Traditional Energy', 'Energy Efficiency', 'Grid Management']
      }
    };

    const sectors: BusinessSector[] = [];
    
    for (const [sectorName, pattern] of Object.entries(sectorPatterns)) {
      let matchCount = 0;
      
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const confidence = Math.min(matchCount / pattern.keywords.length * 1.5, 1);
        
        sectors.push({
          sector: sectorName,
          confidence: Math.round(confidence * 100) / 100,
          subsectors: pattern.subsectors
        });
      }
    }
    
    return sectors.sort((a, b) => b.confidence - a.confidence);
  }

  private assessInnovationLevel(text: string): 'low' | 'medium' | 'high' {
    const innovationKeywords = [
      'innovative', 'revolutionary', 'breakthrough', 'cutting-edge', 'advanced',
      'new', 'novel', 'unique', 'first', 'patent', 'research', 'development'
    ];
    
    let innovationScore = 0;
    for (const keyword of innovationKeywords) {
      if (text.includes(keyword)) innovationScore++;
    }
    
    if (innovationScore >= 4) return 'high';
    if (innovationScore >= 2) return 'medium';
    return 'low';
  }

  private checkSustainabilityFocus(text: string): boolean {
    const sustainabilityKeywords = [
      'sustainable', 'green', 'eco', 'environment', 'renewable', 'clean',
      'carbon', 'emission', 'waste', 'recycling', 'conservation'
    ];
    
    return sustainabilityKeywords.some(keyword => text.includes(keyword));
  }

  private assessSocialImpact(text: string): 'low' | 'medium' | 'high' {
    const socialKeywords = [
      'community', 'social', 'people', 'society', 'education', 'healthcare',
      'welfare', 'employment', 'jobs', 'training', 'development', 'empowerment'
    ];
    
    let socialScore = 0;
    for (const keyword of socialKeywords) {
      if (text.includes(keyword)) socialScore++;
    }
    
    if (socialScore >= 4) return 'high';
    if (socialScore >= 2) return 'medium';
    return 'low';
  }

  private assessEconomicImpact(text: string): 'low' | 'medium' | 'high' {
    const economicKeywords = [
      'revenue', 'profit', 'economic', 'business', 'market', 'growth',
      'investment', 'GDP', 'economy', 'commercial', 'financial', 'income'
    ];
    
    let economicScore = 0;
    for (const keyword of economicKeywords) {
      if (text.includes(keyword)) economicScore++;
    }
    
    if (economicScore >= 4) return 'high';
    if (economicScore >= 2) return 'medium';
    return 'low';
  }

  private checkDigitalTransformation(text: string): boolean {
    const digitalKeywords = [
      'digital', 'technology', 'AI', 'automation', 'software', 'platform',
      'online', 'cloud', 'data', 'analytics', 'IoT', 'blockchain'
    ];
    
    return digitalKeywords.some(keyword => text.includes(keyword));
  }

  private estimateJobCreation(text: string, sectors: BusinessSector[]): number {
    // Simple heuristic based on sector and project description
    let baseJobs = 10;
    
    // Adjust based on sector
    for (const sector of sectors) {
      switch (sector.sector) {
        case 'Manufacturing':
          baseJobs += 50 * sector.confidence;
          break;
        case 'Technology':
          baseJobs += 30 * sector.confidence;
          break;
        case 'Healthcare':
          baseJobs += 40 * sector.confidence;
          break;
        case 'Education':
          baseJobs += 25 * sector.confidence;
          break;
        default:
          baseJobs += 20 * sector.confidence;
      }
    }
    
    // Adjust based on scale indicators
    if (text.includes('large scale') || text.includes('enterprise')) {
      baseJobs *= 2;
    } else if (text.includes('small') || text.includes('startup')) {
      baseJobs *= 0.5;
    }
    
    return Math.round(baseJobs);
  }

  private estimateInvestment(text: string): string {
    const lowInvestmentKeywords = ['small', 'startup', 'simple', 'basic'];
    const highInvestmentKeywords = ['large', 'enterprise', 'complex', 'infrastructure', 'facility'];
    
    const lowCount = lowInvestmentKeywords.filter(keyword => text.includes(keyword)).length;
    const highCount = highInvestmentKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (highCount > lowCount) return 'high';
    if (lowCount > highCount) return 'low';
    return 'medium';
  }

  private assessComplexity(text: string): 'low' | 'medium' | 'high' {
    const complexityKeywords = [
      'complex', 'complicated', 'advanced', 'sophisticated', 'integrated',
      'multiple', 'various', 'comprehensive', 'extensive'
    ];
    
    let complexityScore = 0;
    for (const keyword of complexityKeywords) {
      if (text.includes(keyword)) complexityScore++;
    }
    
    if (complexityScore >= 3) return 'high';
    if (complexityScore >= 1) return 'medium';
    return 'low';
  }
}

export default ProjectNLPAnalyzer;
```

This implementation provides a robust foundation for Vision 2030 scoring with real data integration, NLP analysis, and automated updates. The system combines official Saudi Open Data with intelligent project analysis to provide meaningful Vision 2030 alignment scores.