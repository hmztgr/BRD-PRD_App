import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProjectsPageClient from './projects-page-client'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'My Projects - Smart Business Docs AI',
  description: 'Manage your business document projects and planning sessions',
}

interface ProjectsPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin`)
  }

  // Get user's subscription info for project limits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionTier: true,
      _count: { select: { projects: true } }
    }
  })

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  // Define project limits by tier
  const PROJECT_LIMITS = {
    FREE: 3,
    HOBBY: 10,
    PROFESSIONAL: 20,
    BUSINESS: 50,
    ENTERPRISE: 999
  }

  const maxProjects = PROJECT_LIMITS[user.subscriptionTier] || PROJECT_LIMITS.FREE
  const currentProjects = user._count.projects

  return (
    <ProjectsPageClient
      locale={locale}
      userTier={user.subscriptionTier}
      projectLimits={{
        current: currentProjects,
        max: maxProjects,
        canCreate: currentProjects < maxProjects
      }}
    />
  )
}