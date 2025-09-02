import { formatPrice, getPlanFromPriceId, getTokenLimit } from '@/lib/stripe'

describe('Stripe Utilities', () => {
  describe('formatPrice', () => {
    it('should format USD prices correctly', () => {
      expect(formatPrice(1000)).toBe('$10.00')
      expect(formatPrice(2500)).toBe('$25.00')
      expect(formatPrice(99)).toBe('$0.99')
      expect(formatPrice(0)).toBe('$0.00')
    })

    it('should format other currencies', () => {
      expect(formatPrice(1000, 'eur')).toBe('€10.00')
      expect(formatPrice(1000, 'gbp')).toBe('£10.00')
    })
  })

  describe('getPlanFromPriceId', () => {
    it('should extract plan and interval from price ID', () => {
      const result = getPlanFromPriceId('price_professional_monthly_123')
      expect(result?.plan).toBe('professional')
      expect(result?.interval).toBe('month')
    })

    it('should handle yearly prices', () => {
      const result = getPlanFromPriceId('price_business_yearly_456')
      expect(result?.plan).toBe('business')
      expect(result?.interval).toBe('year')
    })

    it('should return null for invalid price ID', () => {
      const result = getPlanFromPriceId('invalid_price_id')
      expect(result).toBeNull()
    })
  })

  describe('getTokenLimit', () => {
    it('should return correct token limits for different plans', () => {
      expect(getTokenLimit('free')).toBe(10000)
      expect(getTokenLimit('professional')).toBe(100000)
      expect(getTokenLimit('business')).toBe(200000)
      expect(getTokenLimit('enterprise')).toBe(1000000)
    })

    it('should apply bonus for yearly plans', () => {
      expect(getTokenLimit('free', 'year')).toBe(11000) // 10% bonus
      expect(getTokenLimit('professional', 'year')).toBe(110000) // 10% bonus
      expect(getTokenLimit('business', 'year')).toBe(220000) // 10% bonus
    })

    it('should default to monthly limits', () => {
      expect(getTokenLimit('professional', 'month')).toBe(100000)
      expect(getTokenLimit('professional')).toBe(100000) // Default to month
    })
  })
})