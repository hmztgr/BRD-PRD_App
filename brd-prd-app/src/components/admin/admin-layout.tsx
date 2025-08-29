'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { AdminNavigation } from './admin-navigation'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  locale: string
}

export function AdminLayout({ children, locale }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = () => {
    router.push(`/${locale}/auth/signin`)
  }

  const handleUserDashboard = () => {
    router.push(`/${locale}/dashboard`)
  }

  return (
    <div className="flex h-screen bg-background rtl:flex-row-reverse">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 z-50 flex w-64 flex-col bg-card shadow-lg transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${locale === 'ar' 
          ? `right-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
          : `left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Logo className="h-8 w-8" />
            <div className="text-xl font-bold text-foreground">
              Admin Panel
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Admin user info */}
        {session?.user && (
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <AdminNavigation locale={locale} />
        </div>

        {/* Footer actions */}
        <div className="border-t border-border p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleUserDashboard}
          >
            <User className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            User Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-card border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-semibold text-foreground">Admin Panel</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}