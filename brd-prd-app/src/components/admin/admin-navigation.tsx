'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  Settings,
  Activity,
  Shield
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  badge?: string
}

interface AdminNavigationProps {
  locale: string
}

export function AdminNavigation({ locale }: AdminNavigationProps) {
  const pathname = usePathname()

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: `/${locale}/admin`,
      icon: BarChart3,
    },
    {
      name: 'Users',
      href: `/${locale}/admin/users`,
      icon: Users,
      permission: 'manage_users'
    },
    {
      name: 'Subscriptions',
      href: `/${locale}/admin/subscriptions`,
      icon: CreditCard,
      permission: 'manage_subscriptions'
    },
    {
      name: 'Analytics',
      href: `/${locale}/admin/analytics`,
      icon: BarChart3,
      permission: 'view_analytics'
    },
    {
      name: 'Content',
      href: `/${locale}/admin/content`,
      icon: FileText,
      permission: 'manage_content'
    },
    {
      name: 'Feedback',
      href: `/${locale}/admin/feedback`,
      icon: MessageSquare,
      permission: 'manage_feedback'
    },
    {
      name: 'Revenue',
      href: `/${locale}/admin/revenue`,
      icon: DollarSign,
      permission: 'view_analytics'
    },
    {
      name: 'Activity Logs',
      href: `/${locale}/admin/activity`,
      icon: Activity,
      permission: 'manage_system'
    },
    {
      name: 'System',
      href: `/${locale}/admin/system`,
      icon: Shield,
      permission: 'manage_system'
    },
    {
      name: 'Settings',
      href: `/${locale}/admin/settings`,
      icon: Settings,
      permission: 'manage_system'
    }
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="space-y-1 px-3 py-4">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              active
                ? 'bg-secondary text-primary border-r-2 border-primary rtl:border-r-0 rtl:border-l-2'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Icon
              className={cn(
                'mr-3 rtl:ml-3 rtl:mr-0 h-5 w-5 flex-shrink-0 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto rtl:mr-auto rtl:ml-0 inline-block py-0.5 px-2 text-xs rounded-full',
                active 
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}