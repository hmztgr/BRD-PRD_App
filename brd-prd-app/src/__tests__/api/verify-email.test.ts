// Mock the email service first
const mockVerifyEmailToken = jest.fn()
jest.mock('@/lib/email', () => ({
  verifyEmailToken: mockVerifyEmailToken
}))

// Import the API routes after mocking
let POST: any, GET: any
beforeAll(async () => {
  const module = await import('@/app/api/auth/verify-email/route')
  POST = module.POST
  GET = module.GET
})

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully with valid token', async () => {
      mockVerifyEmailToken.mockResolvedValue({
        success: true,
        userId: 'user123',
        email: 'test@example.com'
      })

      const request = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token' })
      })

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Email verified successfully! You can now sign in.')
      expect(mockVerifyEmailToken).toHaveBeenCalledWith('valid-token', 'email_verification')
    })

    it('should reject invalid token', async () => {
      mockVerifyEmailToken.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const request = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' })
      })

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid token')
    })

    it('should reject expired token', async () => {
      mockVerifyEmailToken.mockResolvedValue({
        success: false,
        error: 'Token has expired'
      })

      const request = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'expired-token' })
      })

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Token has expired')
    })

    it('should reject request without token', async () => {
      const request = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Verification token is required')
    })
  })

  describe('GET /api/auth/verify-email', () => {
    it('should redirect to success page on valid token', async () => {
      mockVerifyEmailToken.mockResolvedValue({
        success: true,
        userId: 'user123',
        email: 'test@example.com'
      })

      const request = new Request('http://localhost/api/auth/verify-email?token=valid-token', {
        method: 'GET'
      })

      const response = await GET(request as any)

      expect(response.status).toBe(307) // Temporary Redirect
      expect(response.headers.get('location')).toBe('http://localhost/auth/signin?message=email-verified')
    })

    it('should redirect to error page on invalid token', async () => {
      mockVerifyEmailToken.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      })

      const request = new Request('http://localhost/api/auth/verify-email?token=invalid-token', {
        method: 'GET'
      })

      const response = await GET(request as any)

      expect(response.status).toBe(307) // Temporary Redirect
      expect(response.headers.get('location')).toContain('http://localhost/auth/signin?error=')
    })

    it('should redirect to error page when no token provided', async () => {
      const request = new Request('http://localhost/api/auth/verify-email', {
        method: 'GET'
      })

      const response = await GET(request as any)

      expect(response.status).toBe(307) // Temporary Redirect
      expect(response.headers.get('location')).toContain('http://localhost/auth/signin?error=invalid-token')
    })
  })
})