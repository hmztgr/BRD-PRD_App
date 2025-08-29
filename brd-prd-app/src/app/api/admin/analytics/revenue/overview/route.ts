import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format, startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Generate monthly revenue data
    const revenueData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      // Get payment data for this month
      const [monthlyRevenue, newSubscriptions, canceledSubscriptions] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            },
            status: 'succeeded'
          },
          _sum: {
            amount: true
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
        }),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: monthStart,
              lt: monthEnd
            },
            subscriptionStatus: 'canceled'
          }
        })
      ]);

      // Calculate MRR (Monthly Recurring Revenue) - approximate
      const activeSubscriptions = await prisma.user.count({
        where: {
          subscriptionTier: { not: 'free' },
          subscriptionStatus: 'active',
          createdAt: { lt: monthEnd }
        }
      });

      // Estimate average subscription value (this should ideally come from Stripe)
      const avgSubscriptionValue = monthlyRevenue._sum.amount 
        ? (monthlyRevenue._sum.amount / 100) / (activeSubscriptions || 1)
        : 0;

      revenueData.push({
        month: format(monthStart, 'MMM yyyy'),
        revenue: (monthlyRevenue._sum.amount || 0) / 100, // Convert from cents
        newSubscriptions,
        canceledSubscriptions,
        activeSubscriptions,
        mrr: activeSubscriptions * avgSubscriptionValue,
        churnRate: activeSubscriptions > 0 ? (canceledSubscriptions / activeSubscriptions) * 100 : 0
      });
    }

    // Calculate current metrics
    const currentMonth = startOfMonth(now);
    const [
      currentMonthRevenue,
      totalActiveSubscriptions,
      totalLifetimeRevenue,
      avgRevenuePerUser
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: currentMonth },
          status: 'succeeded'
        },
        _sum: {
          amount: true
        }
      }),
      prisma.user.count({
        where: {
          subscriptionTier: { not: 'free' },
          subscriptionStatus: 'active'
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded'
        },
        _sum: {
          amount: true
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded'
        },
        _avg: {
          amount: true
        }
      })
    ]);

    // Get subscription tier revenue breakdown
    const subscriptionTierRevenue = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionTier: { not: 'free' },
        subscriptionStatus: 'active'
      },
      _count: {
        _all: true
      }
    });

    // Get payment method breakdown (last 30 days)
    const recentPayments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: subDays(now, 30) },
        status: 'succeeded'
      },
      select: {
        amount: true,
        currency: true,
        createdAt: true
      }
    });

    // Calculate growth rates
    const currentMonthData = revenueData[revenueData.length - 1];
    const previousMonthData = revenueData[revenueData.length - 2];
    
    const revenueGrowth = previousMonthData 
      ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100
      : 0;

    const subscriptionGrowth = previousMonthData
      ? ((currentMonthData.activeSubscriptions - previousMonthData.activeSubscriptions) / previousMonthData.activeSubscriptions) * 100
      : 0;

    return NextResponse.json({
      revenueData,
      currentMetrics: {
        currentMonthRevenue: (currentMonthRevenue._sum.amount || 0) / 100,
        totalActiveSubscriptions,
        totalLifetimeRevenue: (totalLifetimeRevenue._sum.amount || 0) / 100,
        avgRevenuePerUser: (avgRevenuePerUser._avg.amount || 0) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        subscriptionGrowth: Math.round(subscriptionGrowth * 100) / 100
      },
      subscriptionTiers: subscriptionTierRevenue.map(tier => ({
        tier: tier.subscriptionTier,
        count: tier._count._all,
        // This would ideally get pricing from Stripe
        estimatedMRR: tier._count._all * 29 // Placeholder calculation
      })),
      paymentTrends: {
        totalPayments: recentPayments.length,
        averagePayment: recentPayments.length > 0 
          ? recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length / 100
          : 0,
        currencyBreakdown: recentPayments.reduce((acc, payment) => {
          acc[payment.currency] = (acc[payment.currency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}