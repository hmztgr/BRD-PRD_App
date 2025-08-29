import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';

// GET /api/admin/analytics/users - User growth and registration trends
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
    const timezone = searchParams.get('timezone') || 'UTC';

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

    // Get total user count
    const totalUsers = await prisma.user.count();

    // Get active users (users who have logged in or created content in the last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            sessions: {
              some: {
                expires: {
                  gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            documents: {
              some: {
                createdAt: {
                  gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        ]
      }
    });

    // Get user registrations over time
    const registrations = await prisma.$queryRaw<Array<{date: string, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt"), ${groupByFormat}) as date,
        COUNT(*) as count
      FROM "users"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt")
      ORDER BY DATE_TRUNC(${period === '1y' ? 'month' : 'day'}, "createdAt")
    `;

    // Get user distribution by subscription tier
    const subscriptionDistribution = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: {
        subscriptionTier: true
      }
    });

    // Get user distribution by role
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Get verification status
    const verificationStats = await prisma.user.groupBy({
      by: ['emailVerified'],
      _count: {
        emailVerified: true
      },
      where: {
        emailVerified: {
          not: null
        }
      }
    });

    const totalVerified = verificationStats.reduce((sum, stat) => sum + stat._count.emailVerified, 0);
    const totalUnverified = totalUsers - totalVerified;

    // Get top industries
    const topIndustries = await prisma.user.groupBy({
      by: ['industry'],
      _count: {
        industry: true
      },
      where: {
        industry: {
          not: null
        }
      },
      orderBy: {
        _count: {
          industry: 'desc'
        }
      },
      take: 10
    });

    // Get language distribution
    const languageDistribution = await prisma.user.groupBy({
      by: ['language'],
      _count: {
        language: true
      }
    });

    // Get retention metrics (users who created content in their first week and are still active)
    const retentionData = await prisma.$queryRaw<Array<{cohort: string, total_users: bigint, retained_users: bigint}>>`
      WITH user_cohorts AS (
        SELECT 
          u.id,
          DATE_TRUNC('week', u."createdAt") as cohort_week,
          u."createdAt" as signup_date
        FROM "users" u
        WHERE u."createdAt" >= ${new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)}
      ),
      first_week_activity AS (
        SELECT 
          uc.id,
          uc.cohort_week,
          COUNT(d.id) as documents_created
        FROM user_cohorts uc
        LEFT JOIN "documents" d ON d."userId" = uc.id 
          AND d."createdAt" BETWEEN uc.signup_date AND (uc.signup_date + INTERVAL '7 days')
        GROUP BY uc.id, uc.cohort_week
      ),
      recent_activity AS (
        SELECT 
          uc.id,
          uc.cohort_week,
          CASE WHEN COUNT(d.id) > 0 OR COUNT(s.id) > 0 THEN 1 ELSE 0 END as is_active
        FROM user_cohorts uc
        LEFT JOIN "documents" d ON d."userId" = uc.id 
          AND d."createdAt" >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
        LEFT JOIN "sessions" s ON s."userId" = uc.id 
          AND s."expires" >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
        GROUP BY uc.id, uc.cohort_week
      )
      SELECT 
        TO_CHAR(fwa.cohort_week, 'YYYY-MM-DD') as cohort,
        COUNT(*) as total_users,
        SUM(ra.is_active) as retained_users
      FROM first_week_activity fwa
      JOIN recent_activity ra ON fwa.id = ra.id
      WHERE fwa.documents_created > 0
      GROUP BY fwa.cohort_week
      ORDER BY fwa.cohort_week DESC
      LIMIT 12
    `;

    await logAdminActivity(
      adminUser.id,
      'view_user_analytics',
      undefined,
      { period, timezone }
    );

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        verifiedUsers: totalVerified,
        unverifiedUsers: totalUnverified
      },
      registrations: registrations.map(r => ({
        date: r.date,
        count: Number(r.count)
      })),
      subscriptionDistribution: subscriptionDistribution.map(s => ({
        tier: s.subscriptionTier,
        count: s._count.subscriptionTier
      })),
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: r._count.role
      })),
      topIndustries: topIndustries.map(i => ({
        industry: i.industry,
        count: i._count.industry
      })),
      languageDistribution: languageDistribution.map(l => ({
        language: l.language,
        count: l._count.language
      })),
      retention: retentionData.map(r => ({
        cohort: r.cohort,
        totalUsers: Number(r.total_users),
        retainedUsers: Number(r.retained_users),
        retentionRate: Number(r.total_users) > 0 ? (Number(r.retained_users) / Number(r.total_users)) * 100 : 0
      }))
    });

  } catch (error: any) {
    console.error('Admin user analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}