import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Generate user growth data for the last N months
    const growthData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      // Get user counts for this month
      const [totalUsers, newUsers, verifiedUsers, subscribedUsers] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { lt: monthEnd }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            },
            emailVerified: { not: null }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            },
            subscriptionTier: { not: 'free' }
          }
        })
      ]);

      growthData.push({
        month: format(monthStart, 'MMM yyyy'),
        totalUsers,
        newUsers,
        verifiedUsers,
        subscribedUsers,
        verificationRate: newUsers > 0 ? (verifiedUsers / newUsers) * 100 : 0,
        conversionRate: newUsers > 0 ? (subscribedUsers / newUsers) * 100 : 0
      });
    }

    // Calculate current month metrics
    const currentMonthStart = startOfMonth(now);
    const [
      currentMonthUsers,
      totalActiveUsers,
      totalVerifiedUsers,
      totalSubscribedUsers
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: currentMonthStart }
        }
      }),
      prisma.user.count({
        where: {
          subscriptionStatus: 'active'
        }
      }),
      prisma.user.count({
        where: {
          emailVerified: { not: null }
        }
      }),
      prisma.user.count({
        where: {
          subscriptionTier: { not: 'free' }
        }
      })
    ]);

    return NextResponse.json({
      growthData,
      currentMetrics: {
        currentMonthUsers,
        totalActiveUsers,
        totalVerifiedUsers,
        totalSubscribedUsers
      }
    });

  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}