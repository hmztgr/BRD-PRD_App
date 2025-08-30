'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  PlusCircle, 
  Users, 
  BarChart3, 
  Settings, 
  Gift,
  Folder
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'New Document',
    href: '/documents/new',
    icon: PlusCircle
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

export function Sidebar() {
  const pathname = usePathname()
  
  // Extract locale from current pathname
  const locale = pathname.split('/')[1] || 'en'

  return (
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
  )
}