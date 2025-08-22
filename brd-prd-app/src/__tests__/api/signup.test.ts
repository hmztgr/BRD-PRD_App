// Mock the dependencies first
const mockSendVerificationEmail = jest.fn()
const mockGenerateVerificationToken = jest.fn()
const mockBcryptHash = jest.fn()

jest.mock('@/lib/email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
  generateVerificationToken: mockGenerateVerificationToken
}))

jest.mock('bcryptjs', () => ({
  hash: mockBcryptHash
}))

// Mock prisma is already set up in jest.setup.js
const { prisma } = require('@/lib/prisma')
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Import the API routes after mocking
let POST: any
beforeAll(async () => {
  const module = await import('@/app/api/auth/signup/route')
  POST = module.POST
})

describe('/api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    // Mock dependencies
    mockPrisma.user.findUnique.mockResolvedValue(null) // No existing user
    mockPrisma.user.create.mockResolvedValue({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      referralCode: 'REF123',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      companyName: null,
      industry: null,
      companySize: null,
      location: null,
      language: 'en',
      timezone: null,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      tokensUsed: 0,
      tokensLimit: 10000,
      billingCycle: 'monthly',
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      referredBy: null,
      totalReferralTokens: 0,
      image: null
    })
    
    mockBcryptHash.mockResolvedValue('hashedpassword' as never)
    mockGenerateVerificationToken.mockResolvedValue('token123')
    mockSendVerificationEmail.mockResolvedValue(true)

    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        locale: 'en'
      })
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(201)
    expect(result.success).toBe(true)
    expect(result.message).toContain('Account created successfully')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user.emailVerified).toBe(false)

    // Verify mocks were called correctly
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    })
    expect(mockBcryptHash).toHaveBeenCalledWith('password123', 12)
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('user123', 'test@example.com')
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'token123',
      'en'
    )
  })

  it('should reject signup with existing email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing123',
      email: 'existing@example.com'
    } as any)

    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      })
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('User with this email already exists')
  })

  it('should reject signup with missing required fields', async () => {
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing name and password
      })
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Name, email, and password are required')
  })

  it('should reject signup with weak password', async () => {
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      })
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Password must be at least 6 characters')
  })

  it('should handle referral code correctly', async () => {
    const referringUser = {
      id: 'referrer123',
      referralCode: 'REF456',
      totalReferralTokens: 0
    }

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // No existing user with email
      .mockResolvedValueOnce(referringUser as any) // Referring user exists

    mockPrisma.user.create.mockResolvedValue({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      referredBy: 'referrer123'
    } as any)

    mockPrisma.user.update.mockResolvedValue({} as any)
    mockBcryptHash.mockResolvedValue('hashedpassword' as never)
    mockGenerateVerificationToken.mockResolvedValue('token123')
    mockSendVerificationEmail.mockResolvedValue(true)

    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        referralCode: 'REF456'
      })
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(201)
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'referrer123' },
      data: {
        totalReferralTokens: {
          increment: 10000
        }
      }
    })
  })
})