'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GenerationModeModal } from '@/components/dashboard/generation-mode-modal'

interface CreateDocumentButtonProps {
  locale: string
  userTier: string
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export function CreateDocumentButton({ 
  locale, 
  userTier, 
  children, 
  variant = "outline",
  className 
}: CreateDocumentButtonProps) {
  const router = useRouter()
  const [showModeModal, setShowModeModal] = useState(false)

  const handleModeSelect = (mode: 'standard' | 'advanced') => {
    router.push(`/${locale}/documents/new?mode=${mode}`)
  }

  return (
    <>
      <Button 
        variant={variant}
        className={className}
        onClick={() => setShowModeModal(true)}
      >
        {children}
      </Button>

      <GenerationModeModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleModeSelect}
        userTier={userTier}
        locale={locale}
      />
    </>
  )
}