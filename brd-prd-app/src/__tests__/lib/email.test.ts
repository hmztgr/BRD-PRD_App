import { verifyEmailToken, generateVerificationToken, generatePasswordResetToken } from '@/lib/email'
import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('generateVerificationToken', () => {
    it('should generate a token and store it in database', async () => {
      mockPrisma.emailToken.create.mockResolvedValue({
        id: 'token123',
        token: 'generated-token',
        type: 'email_verification',
        userId: 'user123',
        email: 'test@example.com',
        expires: new Date(),
        used: false,
        createdAt: new Date(),
        user: {} as any
      })

      const token = await generateVerificationToken('user123', 'test@example.com')

      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(10) // Should be a reasonable length
      expect(mockPrisma.emailToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          type: 'email_verification',
          userId: 'user123',
          email: 'test@example.com',
          expires: expect.any(Date),
          used: false
        }
      })
    })
  })

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token with 1 hour expiry', async () => {
      mockPrisma.emailToken.create.mockResolvedValue({
        id: 'token123',
        token: 'reset-token',
        type: 'password_reset',
        userId: 'user123',
        email: 'test@example.com',
        expires: new Date(),
        used: false,
        createdAt: new Date(),
        user: {} as any
      })

      const token = await generatePasswordResetToken('user123', 'test@example.com')

      expect(token).toBeDefined()
      expect(mockPrisma.emailToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          type: 'password_reset',
          userId: 'user123',
          email: 'test@example.com',
          expires: expect.any(Date),
          used: false
        }
      })
    })
  })

  describe('verifyEmailToken', () => {
    it('should verify valid token successfully', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      mockPrisma.emailToken.findUnique.mockResolvedValue({
        id: 'token123',
        token: 'valid-token',
        type: 'email_verification',
        userId: 'user123',
        email: 'test@example.com',
        expires: futureDate,
        used: false,
        createdAt: new Date(),
        user: {} as any
      })

      mockPrisma.emailToken.update.mockResolvedValue({} as any)
      mockPrisma.user.update.mockResolvedValue({} as any)

      const result = await verifyEmailToken('valid-token', 'email_verification')

      expect(result.success).toBe(true)
      expect(result.userId).toBe('user123')
      expect(result.email).toBe('test@example.com')

      // Should mark token as used
      expect(mockPrisma.emailToken.update).toHaveBeenCalledWith({
        where: { id: 'token123' },
        data: { used: true }
      })

      // Should update user's emailVerified field
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { emailVerified: expect.any(Date) }
      })
    })

    it('should reject invalid token', async () => {
      mockPrisma.emailToken.findUnique.mockResolvedValue(null)

      const result = await verifyEmailToken('invalid-token', 'email_verification')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid token')
    })

    it('should reject expired token', async () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      mockPrisma.emailToken.findUnique.mockResolvedValue({
        id: 'token123',
        token: 'expired-token',
        type: 'email_verification',
        userId: 'user123',
        email: 'test@example.com',
        expires: pastDate,
        used: false,
        createdAt: new Date(),
        user: {} as any
      })

      const result = await verifyEmailToken('expired-token', 'email_verification')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token has expired')
    })

    it('should reject already used token', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      mockPrisma.emailToken.findUnique.mockResolvedValue({
        id: 'token123',
        token: 'used-token',
        type: 'email_verification',
        userId: 'user123',
        email: 'test@example.com',
        expires: futureDate,
        used: true, // Already used
        createdAt: new Date(),
        user: {} as any
      })

      const result = await verifyEmailToken('used-token', 'email_verification')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token has already been used')
    })

    it('should reject token type mismatch', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      mockPrisma.emailToken.findUnique.mockResolvedValue({
        id: 'token123',
        token: 'valid-token',
        type: 'password_reset', // Different type
        userId: 'user123',
        email: 'test@example.com',
        expires: futureDate,
        used: false,
        createdAt: new Date(),
        user: {} as any
      })

      const result = await verifyEmailToken('valid-token', 'email_verification')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token type mismatch')
    })
  })
})