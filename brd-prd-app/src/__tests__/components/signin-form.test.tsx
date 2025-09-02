import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/components/forms/signin-form'
import { signIn } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react')

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock next/navigation
const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/en/auth/signin',
}))

describe('SignInForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render signin form correctly', () => {
    render(<SignInForm />)

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Enter your email and password to sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    // Google sign-in button is temporarily disabled, so we don't test for it
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('should handle successful credentials signin', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any)

    render(<SignInForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should handle signin error', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' } as any)

    render(<SignInForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  // Google sign-in is temporarily disabled, so we skip this test
  it.skip('should handle Google signin', async () => {
    mockSignIn.mockResolvedValue({ ok: true } as any)

    render(<SignInForm />)

    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(googleButton)

    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/en/dashboard' })
  })

  it('should show loading state during signin', async () => {
    let resolvePromise: (value: any) => void
    mockSignIn.mockImplementation(() => new Promise(resolve => { resolvePromise = resolve }))

    render(<SignInForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    await act(async () => {
      await user.click(submitButton)
    })

    // Should show loading state
    expect(submitButton).toBeDisabled()
    
    // Resolve the promise
    await act(async () => {
      resolvePromise({ ok: true } as any)
    })
  })

  it('should require email and password', async () => {
    render(<SignInForm />)

    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    await user.click(submitButton)

    // Form validation should prevent submission
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('should have link to signup page', () => {
    render(<SignInForm />)

    const signupLink = screen.getByRole('link', { name: 'Sign up' })
    expect(signupLink).toHaveAttribute('href', '/en/auth/signup')
  })

  it('should handle network error gracefully', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<SignInForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })
})