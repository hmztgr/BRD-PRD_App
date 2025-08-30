'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface ResetPasswordFormProps {
  locale: string
  token: string
}

export function ResetPasswordForm({ locale, token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Validate token on component mount
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        if (response.ok) {
          const data = await response.json()
          setTokenValid(data.valid)
          setUserEmail(data.email)
        } else {
          setTokenValid(false)
          const data = await response.json()
          setError(data.error || 'Invalid or expired reset token')
        }
      } catch {
        setTokenValid(false)
        setError('Failed to validate reset token')
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}/auth/signin`)
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to reset password')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex justify-center items-center p-8">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (tokenValid === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-red-600">
            Invalid Link
          </CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-green-600">
            Password Reset Successful
          </CardTitle>
          <CardDescription className="text-center">
            Your password has been successfully reset. You will be redirected to the sign in page shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href={`/${locale}/auth/signin`}
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Sign in now
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          {userEmail && `Setting new password for ${userEmail}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Reset Password
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Remember your password?{' '}
          <Link
            href={`/${locale}/auth/signin`}
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}