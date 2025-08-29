import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';

// GET /api/admin/activity - Get admin activity logs
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    
    // Only super_admin can view all admin activities, regular admins can only see their own
    const canViewAllActivities = adminUser.role === 'super_admin';
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const adminId = searchParams.get('adminId');
    const action = searchParams.get('action');
    const targetId = searchParams.get('targetId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If not super_admin, only show own activities
    if (!canViewAllActivities) {
      where.adminId = adminUser.id;
    } else if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      };
    }

    if (targetId) {
      where.targetId = targetId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get activities with pagination
    const [activities, totalCount] = await Promise.all([
      prisma.adminActivity.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.adminActivity.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get activity summary for the current filters
    const activitySummary = await prisma.adminActivity.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get admin activity summary (if super_admin viewing all)
    let adminSummary: any[] = [];
    if (canViewAllActivities && !adminId) {
      const adminGroupResult = await prisma.adminActivity.groupBy({
        by: ['adminId'],
        where: {
          ...where,
          adminId: undefined // Remove adminId filter for this query
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });
      adminSummary = adminGroupResult;

      // Get admin details for the summary
      const adminIds = adminSummary.map(a => a.adminId);
      const adminDetails = await prisma.user.findMany({
        where: {
          id: {
            in: adminIds
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      adminSummary = adminSummary.map(summary => {
        const admin = adminDetails.find(a => a.id === summary.adminId);
        return {
          adminId: summary.adminId,
          admin: admin || null,
          activityCount: summary._count.id
        };
      });
    }

    // Get recent activity trends (last 30 days)
    const activityTrends = await prisma.$queryRaw<Array<{date: string, count: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM "admin_activities"
      WHERE "createdAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        ${canViewAllActivities ? '' : 'AND "adminId" = ' + `'${adminUser.id}'`}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY DATE_TRUNC('day', "createdAt") DESC
      LIMIT 30
    `;

    // Log this activity view (but don't create infinite loops)
    if (req.url && !req.url.includes('action=view_admin_activity')) {
      await logAdminActivity(
        adminUser.id,
        'view_admin_activity',
        undefined,
        { 
          filters: { adminId, action, targetId, startDate, endDate },
          pagination: { page, limit }
        }
      );
    }

    return NextResponse.json({
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        targetId: activity.targetId,
        details: activity.details,
        createdAt: activity.createdAt,
        admin: {
          id: activity.admin.id,
          name: activity.admin.name,
          email: activity.admin.email,
          role: activity.admin.role
        }
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      summary: {
        byAction: activitySummary.map(summary => ({
          action: summary.action,
          count: summary._count.id
        })),
        byAdmin: adminSummary,
        trends: activityTrends.map(trend => ({
          date: trend.date,
          count: Number(trend.count)
        }))
      },
      permissions: {
        canViewAllActivities
      }
    });

  } catch (error: any) {
    console.error('Admin activity GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}

// POST /api/admin/activity - Manually log admin activity (for external integrations)
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    
    const body = await req.json();
    const { action, targetId, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const activity = await prisma.adminActivity.create({
      data: {
        adminId: adminUser.id,
        action: `manual_${action}`,
        targetId,
        details: details || null
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id,
        action: activity.action,
        targetId: activity.targetId,
        details: activity.details,
        createdAt: activity.createdAt,
        admin: {
          id: activity.admin.id,
          name: activity.admin.name,
          email: activity.admin.email,
          role: activity.admin.role
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin activity POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}