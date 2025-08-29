import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';

// GET /api/admin/analytics/subscriptions - Revenue and subscription metrics
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const currency = searchParams.get('currency') || 'usd';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupByFormat = 'YYYY-MM';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = 'YYYY-MM-DD';
    }

    // Get subscription overview
    const subscriptionOverview = await prisma.user.groupBy({
      by: ['subscriptionTier', 'subscriptionStatus'],
      _count: {
        id: true
      }
    });

    // Calculate MRR (Monthly Recurring Revenue) by tier
    const tierPricing = {
      free: 0,
      professional: 29, // $29/month
      business: 99,     // $99/month
      enterprise: 299  // $299/month
    };

    let totalMRR = 0;
    const mrrByTier: { [key: string]: number } = {};

    subscriptionOverview.forEach(sub => {
      if (sub.subscriptionStatus === 'active') {
        const price = tierPricing[sub.subscriptionTier as keyof typeof tierPricing] || 0;
        const revenue = price * sub._count.id;
        totalMRR += revenue;
        mrrByTier[sub.subscriptionTier] = (mrrByTier[sub.subscriptionTier] || 0) + revenue;
      }
    });

    // Get payment history and revenue over time
    const revenueOverTime = await prisma.$queryRaw<Array<{date: string, amount: bigint, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt"), ${groupByFormat}) as date,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM "payments"
      WHERE "createdAt" >= ${startDate}
        AND status = 'succeeded'
        AND currency = ${currency}
      GROUP BY DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt")
      ORDER BY DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt")
    `;

    // Get subscription transitions (upgrades/downgrades)
    const subscriptionTransitions = await prisma.$queryRaw<Array<{
      from_tier: string,
      to_tier: string,
      count: bigint
    }>>`
      WITH user_subscription_changes AS (
        SELECT 
          u.id,
          u."subscriptionTier",
          LAG(u."subscriptionTier") OVER (PARTITION BY u.id ORDER BY u."updatedAt") as prev_tier
        FROM "users" u
        WHERE u."updatedAt" >= ${startDate}
      )
      SELECT 
        prev_tier as from_tier,
        "subscriptionTier" as to_tier,
        COUNT(*) as count
      FROM user_subscription_changes
      WHERE prev_tier IS NOT NULL AND prev_tier != "subscriptionTier"
      GROUP BY prev_tier, "subscriptionTier"
      ORDER BY count DESC
    `;

    // Get churn analysis
    const churnAnalysis = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionStatus: 'canceled',
        updatedAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get total successful payments
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'succeeded',
        currency: currency
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Get failed payments
    const failedPayments = await prisma.payment.count({
      where: {
        status: 'failed',
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get average revenue per user (ARPU)
    const activeSubscribersCount = subscriptionOverview
      .filter(sub => sub.subscriptionStatus === 'active' && sub.subscriptionTier !== 'free')
      .reduce((sum, sub) => sum + sub._count.id, 0);

    const arpu = activeSubscribersCount > 0 ? totalMRR / activeSubscribersCount : 0;

    // Get subscription duration analysis
    const subscriptionDurations = await prisma.$queryRaw<Array<{
      tier: string,
      avg_days: number,
      min_days: number,
      max_days: number
    }>>`
      SELECT 
        "subscriptionTier" as tier,
        AVG(EXTRACT(days FROM (COALESCE("subscriptionEndsAt", NOW()) - "createdAt"))) as avg_days,
        MIN(EXTRACT(days FROM (COALESCE("subscriptionEndsAt", NOW()) - "createdAt"))) as min_days,
        MAX(EXTRACT(days FROM (COALESCE("subscriptionEndsAt", NOW()) - "createdAt"))) as max_days
      FROM "users"
      WHERE "subscriptionTier" != 'free'
        AND "createdAt" >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}
      GROUP BY "subscriptionTier"
    `;

    // Get conversion funnel (free -> paid)
    const conversionFunnel = await prisma.$queryRaw<Array<{
      signup_cohort: string,
      total_signups: bigint,
      converted_to_paid: bigint
    }>>`
      WITH signup_cohorts AS (
        SELECT 
          u.id,
          TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'YYYY-MM') as signup_month,
          u."createdAt"
        FROM "users" u
        WHERE u."createdAt" >= ${new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)}
      ),
      conversions AS (
        SELECT 
          sc.id,
          sc.signup_month,
          CASE WHEN u."subscriptionTier" != 'free' THEN 1 ELSE 0 END as converted
        FROM signup_cohorts sc
        JOIN "users" u ON sc.id = u.id
      )
      SELECT 
        signup_month as signup_cohort,
        COUNT(*) as total_signups,
        SUM(converted) as converted_to_paid
      FROM conversions
      GROUP BY signup_month
      ORDER BY signup_month DESC
      LIMIT 6
    `;

    await logAdminActivity(
      adminUser.id,
      'view_subscription_analytics',
      undefined,
      { period, currency }
    );

    return NextResponse.json({
      overview: {
        totalMRR,
        totalRevenue: Number(totalRevenue._sum.amount || 0) / 100, // Convert from cents
        totalPayments: totalRevenue._count.id,
        failedPayments,
        arpu,
        activeSubscribers: activeSubscribersCount
      },
      mrrByTier,
      subscriptionDistribution: subscriptionOverview.map(sub => ({
        tier: sub.subscriptionTier,
        status: sub.subscriptionStatus,
        count: sub._count.id
      })),
      revenueOverTime: revenueOverTime.map(r => ({
        date: r.date,
        amount: Number(r.amount) / 100, // Convert from cents
        count: Number(r.count)
      })),
      subscriptionTransitions: subscriptionTransitions.map(t => ({
        fromTier: t.from_tier,
        toTier: t.to_tier,
        count: Number(t.count)
      })),
      churnAnalysis: churnAnalysis.map(c => ({
        tier: c.subscriptionTier,
        count: c._count.id
      })),
      subscriptionDurations: subscriptionDurations.map(d => ({
        tier: d.tier,
        avgDays: Math.round(d.avg_days),
        minDays: Math.round(d.min_days),
        maxDays: Math.round(d.max_days)
      })),
      conversionFunnel: conversionFunnel.map(c => ({
        cohort: c.signup_cohort,
        totalSignups: Number(c.total_signups),
        convertedToPaid: Number(c.converted_to_paid),
        conversionRate: Number(c.total_signups) > 0 ? (Number(c.converted_to_paid) / Number(c.total_signups)) * 100 : 0
      }))
    });

  } catch (error: any) {
    console.error('Admin subscription analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}