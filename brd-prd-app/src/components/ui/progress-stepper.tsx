'use client'

import React from 'react'
import { Check, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepStatus {
  id: string
  title: string
  description?: string
  status: 'pending' | 'active' | 'completed' | 'error'
  completedAt?: Date
  estimatedDuration?: string
  substeps?: StepStatus[]
}

interface ProgressStepperProps {
  steps: StepStatus[]
  orientation?: 'horizontal' | 'vertical'
  showDescription?: boolean
  showProgress?: boolean
  className?: string
  locale?: string
  onStepClick?: (step: StepStatus) => void
}

const translations = {
  en: {
    pending: 'Pending',
    active: 'In Progress',
    completed: 'Completed',
    error: 'Error',
    completedAt: 'Completed at',
    estimatedDuration: 'Est. duration'
  },
  ar: {
    pending: 'في الانتظار',
    active: 'قيد التنفيذ',
    completed: 'مكتمل',
    error: 'خطأ',
    completedAt: 'اكتمل في',
    estimatedDuration: 'المدة المقدرة'
  }
}

export function ProgressStepper({
  steps,
  orientation = 'vertical',
  showDescription = true,
  showProgress = true,
  className,
  locale = 'en',
  onStepClick
}: ProgressStepperProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'
  
  const completedSteps = steps.filter(step => step.status === 'completed').length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStepIcon = (step: StepStatus) => {
    switch (step.status) {
      case 'completed':
        return <Check className="h-4 w-4 text-white" />
      case 'active':
        return <Circle className="h-4 w-4 text-white fill-current animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-white" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepColor = (step: StepStatus) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500 border-green-500'
      case 'active':
        return 'bg-blue-500 border-blue-500'
      case 'error':
        return 'bg-red-500 border-red-500'
      default:
        return 'bg-gray-200 border-gray-300'
    }
  }

  const getConnectorColor = (fromStep: StepStatus, toStep: StepStatus) => {
    if (fromStep.status === 'completed') {
      return 'bg-green-500'
    } else if (fromStep.status === 'active' || fromStep.status === 'error') {
      return 'bg-blue-500'
    }
    return 'bg-gray-200'
  }

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Progress Summary */}
      {showProgress && (
        <div className={`mb-6 p-4 bg-muted/50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium">
              {locale === 'ar' ? 'إجمالي التقدم' : 'Overall Progress'}
            </span>
            <span className="text-sm text-muted-foreground">
              {completedSteps} / {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className={`text-xs text-muted-foreground mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {Math.round(progressPercentage)}% {locale === 'ar' ? 'مكتمل' : 'complete'}
          </p>
        </div>
      )}

      {/* Steps */}
      <div className={cn(
        'flex',
        orientation === 'horizontal' 
          ? 'flex-row items-start space-x-8 overflow-x-auto pb-4' 
          : 'flex-col space-y-4',
        isRTL && orientation === 'horizontal' ? 'flex-row-reverse space-x-reverse' : ''
      )}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex',
              orientation === 'horizontal' 
                ? 'flex-col items-center min-w-0 flex-1' 
                : `items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`,
              onStepClick && 'cursor-pointer hover:opacity-80 transition-opacity'
            )}
            onClick={() => onStepClick?.(step)}
          >
            {orientation === 'vertical' && (
              <div className="flex flex-col items-center">
                {/* Step Icon */}
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2',
                  getStepColor(step),
                  step.status === 'pending' && 'text-gray-400'
                )}>
                  {getStepIcon(step)}
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-0.5 h-8 mt-2',
                    getConnectorColor(step, steps[index + 1])
                  )} />
                )}
              </div>
            )}

            {orientation === 'horizontal' && (
              <div className="flex items-center mb-4">
                {/* Step Icon */}
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2',
                  getStepColor(step),
                  step.status === 'pending' && 'text-gray-400'
                )}>
                  {getStepIcon(step)}
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-20 mx-4',
                    getConnectorColor(step, steps[index + 1])
                  )} />
                )}
              </div>
            )}

            {/* Step Content */}
            <div className={cn(
              'min-w-0',
              orientation === 'horizontal' ? 'text-center' : `${isRTL ? 'mr-4 text-right' : 'ml-4 text-left'}`
            )}>
              <h4 className={cn(
                'font-medium text-sm',
                step.status === 'completed' ? 'text-green-700' :
                step.status === 'active' ? 'text-blue-700' :
                step.status === 'error' ? 'text-red-700' :
                'text-gray-600'
              )}>
                {step.title}
              </h4>
              
              {showDescription && step.description && (
                <p className={cn(
                  'text-xs text-muted-foreground mt-1',
                  orientation === 'horizontal' ? 'text-center' : isRTL ? 'text-right' : 'text-left'
                )}>
                  {step.description}
                </p>
              )}

              {/* Step Status Info */}
              <div className={cn(
                'mt-2 space-y-1',
                orientation === 'horizontal' ? 'text-center' : isRTL ? 'text-right' : 'text-left'
              )}>
                {step.completedAt && (
                  <p className="text-xs text-green-600">
                    {t.completedAt}: {step.completedAt.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
                
                {step.estimatedDuration && step.status === 'pending' && (
                  <p className="text-xs text-muted-foreground">
                    {t.estimatedDuration}: {step.estimatedDuration}
                  </p>
                )}
              </div>

              {/* Substeps */}
              {step.substeps && step.substeps.length > 0 && (
                <div className={cn(
                  'mt-3 space-y-1',
                  orientation === 'horizontal' ? 'text-center' : isRTL ? 'text-right' : 'text-left'
                )}>
                  {step.substeps.map((substep) => (
                    <div
                      key={substep.id}
                      className={`flex items-center gap-2 text-xs ${
                        isRTL ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        substep.status === 'completed' ? 'bg-green-500' :
                        substep.status === 'active' ? 'bg-blue-500' :
                        substep.status === 'error' ? 'bg-red-500' :
                        'bg-gray-300'
                      )} />
                      <span className={cn(
                        substep.status === 'completed' ? 'text-green-600 line-through' :
                        substep.status === 'active' ? 'text-blue-600' :
                        substep.status === 'error' ? 'text-red-600' :
                        'text-gray-500'
                      )}>
                        {substep.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div className={cn(
        'mt-6 p-3 bg-muted/30 rounded-lg',
        isRTL ? 'text-right' : 'text-left'
      )}>
        <h5 className="text-xs font-medium mb-2">
          {locale === 'ar' ? 'مفتاح الحالة' : 'Status Legend'}
        </h5>
        <div className={cn(
          'flex flex-wrap gap-4 text-xs',
          isRTL ? 'flex-row-reverse' : 'flex-row'
        )}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span>{t.pending}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{t.active}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>{t.completed}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>{t.error}</span>
          </div>
        </div>
      </div>
    </div>
  )
}