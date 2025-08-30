import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get usage activity for the last N days
    const activityData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = startOfDay(subDays(now, i));
      const dayEnd = startOfDay(subDays(now, i - 1));

      // Get activity metrics for this day
      const [
        documentsGenerated,
        tokensUsed,
        activeUsers,
        usageByModel,
        usageByOperation
      ] = await Promise.all([
        prisma.usageHistory.count({
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd
            },
            operation: 'document_generation',
            success: true
          }
        }),
        prisma.usageHistory.aggregate({
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd
            },
            success: true
          },
          _sum: {
            tokensUsed: true
          }
        }),
        prisma.usageHistory.groupBy({
          by: ['userId'],
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        }).then(result => result.length),
        prisma.usageHistory.groupBy({
          by: ['aiModel'],
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd
            },
            aiModel: { not: null },
            success: true
          },
          _count: {
            _all: true
          }
        }),
        prisma.usageHistory.groupBy({
          by: ['operation'],
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd
            },
            success: true
          },
          _count: {
            _all: true
          }
        })
      ]);

      activityData.push({
        date: format(dayStart, 'MMM dd'),
        documentsGenerated,
        tokensUsed: tokensUsed._sum.tokensUsed || 0,
        activeUsers,
        usageByModel: Object.fromEntries(
          usageByModel.map(item => [item.aiModel, item._count._all])
        ),
        usageByOperation: Object.fromEntries(
          usageByOperation.map(item => [item.operation, item._count._all])
        )
      });
    }

    // Get subscription tier usage patterns
    const subscriptionUsage = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: {
        _all: true
      },
      _avg: {
        tokensUsed: true
      }
    });

    // Get top users by token usage (last 30 days)
    const topUsers = await prisma.usageHistory.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: subDays(now, 30)
        }
      },
      _sum: {
        tokensUsed: true
      },
      orderBy: {
        _sum: {
          tokensUsed: 'desc'
        }
      },
      take: 10
    });

    // Get user details for top users
    const topUsersDetails = await Promise.all(
      topUsers.map(async (user) => {
        const userInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true,
            createdAt: true
          }
        });
        return {
          ...userInfo,
          tokensUsed: user._sum.tokensUsed || 0
        };
      })
    );

    return NextResponse.json({
      activityData,
      subscriptionUsage: subscriptionUsage.map(tier => ({
        tier: tier.subscriptionTier,
        userCount: tier._count._all,
        avgTokensUsed: Math.round(tier._avg.tokensUsed || 0)
      })),
      topUsers: topUsersDetails
    });

  } catch (error) {
    console.error('Error fetching user activity analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}