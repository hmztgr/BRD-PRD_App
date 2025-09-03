'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Folder, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  stage: string
  confidence: number
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
  _count: {
    documents: number
    conversations: number
  }
}

interface RecentProjectsWidgetProps {
  locale: string
  translations: {
    recentProjects: string
    noProjectsYet: string
    createFirstProject: string
    viewAllProjects: string
    confidence: string
    documents: string
    conversations: string
    lastActive: string
    stage: string
    continueProject: string
  }
}

export function RecentProjectsWidget({ locale, translations: t }: RecentProjectsWidgetProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await fetch('/api/projects/recent')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        } else {
          // Silently handle error - dashboard should still work without projects
          setProjects([])
        }
      } catch (err) {
        // Use mock data for development
        console.log('Projects API not available, showing placeholder')
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentProjects()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.recentProjects}</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.recentProjects}</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t.noProjectsYet}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/documents/new?mode=advanced`}>
              {t.createFirstProject}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t.recentProjects}</CardTitle>
        <Folder className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {projects.slice(0, 3).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium truncate">{project.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {project.stage}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(project.lastActivity), { addSuffix: true })}
                  </span>
                  <span>{project.counts?.documents || 0} {t.documents}</span>
                  <span>{project.confidence}% {t.confidence}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/documents/new?mode=advanced&projectId=${project.id}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
        
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/${locale}/projects`}>
            {t.viewAllProjects}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}