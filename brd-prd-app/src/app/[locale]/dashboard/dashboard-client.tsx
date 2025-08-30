'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { GenerationModeModal } from '@/components/dashboard/generation-mode-modal'

interface DashboardClientProps {
  locale: string
  t: any // translations object
  userTier: string
}

export function DashboardClient({ locale, t, userTier }: DashboardClientProps) {
  const router = useRouter()
  const [showModeModal, setShowModeModal] = useState(false)

  const handleModeSelect = (mode: 'standard' | 'advanced') => {
    router.push(`/${locale}/documents/new?mode=${mode}`)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.createDocument}</CardTitle>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowModeModal(true)}
          >
            {t.newDocument}
          </Button>
        </CardContent>
      </Card>

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