import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's referral data
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        referralCode: true,
        totalReferralTokens: true,
        referrals: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            subscriptionTier: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get referral rewards
    const referralRewards = await prisma.referralReward.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        type: true,
        tokens: true,
        description: true,
        claimed: true,
        createdAt: true,
        referredId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const totalReferrals = user.referrals.length
    const pendingReferrals = user.referrals.filter(ref => 
      !referralRewards.some(reward => reward.referredId === ref.id && reward.claimed)
    ).length
    const totalTokensEarned = referralRewards
      .filter(reward => reward.claimed)
      .reduce((sum, reward) => sum + reward.tokens, 0)
    const availableTokens = user.totalReferralTokens

    // Format referral history
    const referralHistory = user.referrals.map(referral => {
      const reward = referralRewards.find(r => r.referredId === referral.id)
      return {
        id: referral.id,
        email: referral.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
        status: reward?.claimed ? 'completed' : 'pending',
        tokensEarned: reward?.claimed ? reward.tokens : 0,
        createdAt: referral.createdAt.toISOString()
      }
    })

    const response = {
      referralCode: user.referralCode,
      totalReferrals,
      pendingReferrals,
      totalTokensEarned,
      availableTokens,
      referralHistory
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}