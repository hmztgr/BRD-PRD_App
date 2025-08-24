'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  PlusCircle, 
  Folder, 
  Users, 
  Gift, 
  Settings 
} from 'lucide-react'
import { GenerationModeModal } from '@/components/dashboard/generation-mode-modal'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'New Document',
    href: '/documents/new',
    icon: PlusCircle,
    useModal: true // Special flag for items that should use modal
  },
  {
    title: 'My Documents',
    href: '/documents',
    icon: Folder
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users
  },
  {
    title: 'Referrals',
    href: '/referral',
    icon: Gift
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

interface SidebarClientProps {
  userTier: string
}

export function SidebarClient({ userTier }: SidebarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showModeModal, setShowModeModal] = useState(false)
  
  // Extract locale from current pathname
  const locale = pathname.split('/')[1] || 'en'

  const handleModeSelect = (mode: 'standard' | 'advanced') => {
    router.push(`/${locale}/documents/new?mode=${mode}`)
  }

  const handleItemClick = (item: any, e: React.MouseEvent) => {
    if (item.useModal) {
      e.preventDefault()
      setShowModeModal(true)
    }
  }

  return (
    <>
      <div className="pb-12 w-64">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {sidebarItems.map((item, index) => {
                const fullHref = `/${locale}${item.href}`
                return (
                  <Link
                    key={index}
                    href={fullHref}
                    onClick={(e) => handleItemClick(item, e)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === fullHref ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

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