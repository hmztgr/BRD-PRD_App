#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * 
 * Seeds the production database with:
 * 1. Default templates
 * 2. System configurations
 * 3. Essential data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const log = (message) => {
  console.log(`[SEED] ${message}`);
};

async function seedProduction() {
  try {
    log('Starting production database seeding...');

    // 1. Create default templates
    log('Creating default templates...');
    
    const defaultTemplates = [
      {
        name: 'Business Requirements Document (Standard)',
        description: 'Comprehensive BRD template for business projects',
        category: 'brd',
        language: 'en',
        isPublic: true,
        prompt: `Create a comprehensive Business Requirements Document with the following sections:
1. Executive Summary
2. Project Overview
3. Business Objectives
4. Stakeholder Analysis
5. Functional Requirements
6. Non-Functional Requirements
7. Assumptions and Constraints
8. Success Criteria
9. Risk Assessment
10. Implementation Timeline

Use professional formatting and ensure all sections are detailed and actionable.`,
        structure: {
          sections: [
            'executive_summary',
            'project_overview',
            'business_objectives',
            'stakeholder_analysis',
            'functional_requirements',
            'non_functional_requirements',
            'assumptions_constraints',
            'success_criteria',
            'risk_assessment',
            'implementation_timeline'
          ]
        }
      },
      {
        name: 'Product Requirements Document (Tech)',
        description: 'Technical PRD template for software products',
        category: 'prd',
        language: 'en',
        isPublic: true,
        prompt: `Create a detailed Product Requirements Document including:
1. Product Vision and Strategy
2. User Stories and Personas
3. Feature Specifications
4. Technical Requirements
5. API Specifications
6. User Interface Requirements
7. Performance Requirements
8. Security Requirements
9. Testing Strategy
10. Release Plan

Focus on technical feasibility and user experience.`,
        structure: {
          sections: [
            'product_vision',
            'user_stories',
            'feature_specifications',
            'technical_requirements',
            'api_specifications',
            'ui_requirements',
            'performance_requirements',
            'security_requirements',
            'testing_strategy',
            'release_plan'
          ]
        }
      },
      {
        name: 'وثيقة متطلبات العمل (عربي)',
        description: 'قالب شامل لوثيقة متطلبات العمل باللغة العربية',
        category: 'brd',
        language: 'ar',
        isPublic: true,
        prompt: `أنشئ وثيقة متطلبات عمل شاملة تتضمن الأقسام التالية:
1. الملخص التنفيذي
2. نظرة عامة على المشروع
3. الأهداف التجارية
4. تحليل أصحاب المصلحة
5. المتطلبات الوظيفية
6. المتطلبات غير الوظيفية
7. الافتراضات والقيود
8. معايير النجاح
9. تقييم المخاطر
10. الجدول الزمني للتنفيذ

استخدم تنسيقًا مهنيًا واضحًا مع التركيز على السوق السعودي ومتطلبات الامتثال المحلية.`,
        structure: {
          sections: [
            'executive_summary_ar',
            'project_overview_ar',
            'business_objectives_ar',
            'stakeholder_analysis_ar',
            'functional_requirements_ar',
            'non_functional_requirements_ar',
            'assumptions_constraints_ar',
            'success_criteria_ar',
            'risk_assessment_ar',
            'implementation_timeline_ar'
          ]
        }
      },
      {
        name: 'Technical Architecture Document',
        description: 'System architecture and technical design template',
        category: 'technical',
        language: 'en',
        isPublic: true,
        prompt: `Create a comprehensive Technical Architecture Document with:
1. Architecture Overview
2. System Components
3. Technology Stack
4. Database Design
5. API Architecture
6. Security Architecture
7. Scalability Considerations
8. Performance Requirements
9. Monitoring and Logging
10. Deployment Strategy

Include diagrams, code examples, and detailed technical specifications.`,
        structure: {
          sections: [
            'architecture_overview',
            'system_components',
            'technology_stack',
            'database_design',
            'api_architecture',
            'security_architecture',
            'scalability',
            'performance',
            'monitoring',
            'deployment'
          ]
        }
      },
      {
        name: 'Project Management Plan',
        description: 'Comprehensive project management and timeline template',
        category: 'project_management',
        language: 'en',
        isPublic: true,
        prompt: `Create a detailed Project Management Plan including:
1. Project Charter
2. Scope Definition
3. Work Breakdown Structure
4. Resource Allocation
5. Timeline and Milestones
6. Risk Management Plan
7. Communication Plan
8. Quality Assurance
9. Budget Planning
10. Change Management

Focus on practical implementation and team coordination.`,
        structure: {
          sections: [
            'project_charter',
            'scope_definition',
            'work_breakdown',
            'resource_allocation',
            'timeline_milestones',
            'risk_management',
            'communication_plan',
            'quality_assurance',
            'budget_planning',
            'change_management'
          ]
        }
      }
    ];

    // Create templates
    for (const template of defaultTemplates) {
      try {
        await prisma.template.upsert({
          where: { 
            name: template.name
          },
          update: template,
          create: template
        });
        log(`Created template: ${template.name}`);
      } catch (err) {
        console.warn(`Failed to create template ${template.name}:`, err.message);
      }
    }

    log('✅ Production database seeding completed');
    
    // Log statistics
    const templateCount = await prisma.template.count();
    log(`Total templates in database: ${templateCount}`);

  } catch (error) {
    console.error('Production seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedProduction()
    .then(() => {
      log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProduction };