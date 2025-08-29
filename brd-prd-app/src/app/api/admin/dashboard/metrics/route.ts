import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);

    // Fetch dashboard metrics in parallel
    const [
      totalUsers,
      newUsersToday,
      totalRevenue,
      lastMonthRevenue,
      activeSubscriptions,
      pendingFeedback,
      recentActivities,
      systemHealth
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      
      // Total revenue (all time)
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'succeeded'
        }
      }).then(result => (result._sum.amount || 0) / 100), // Convert from cents
      
      // Last month revenue for growth calculation
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'succeeded',
          createdAt: {
            gte: subDays(thirtyDaysAgo, 30),
            lt: thirtyDaysAgo
          }
        }
      }).then(result => (result._sum.amount || 0) / 100),
      
      // Active subscriptions
      prisma.user.count({
        where: {
          subscriptionStatus: 'active',
          subscriptionTier: {
            not: 'FREE'
          }
        }
      }),
      
      // Pending feedback
      prisma.feedback.count({
        where: {
          status: 'pending'
        }
      }),
      
      // Recent activities (last 10)
      prisma.adminActivity.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      
      // System health check (simplified)
      checkSystemHealth()
    ]);

    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.action,
      description: getActivityDescription(activity.action, activity.details),
      timestamp: activity.createdAt.toISOString(),
      user: activity.admin?.name || activity.admin?.email || 'System',
      status: 'completed'
    }));

    const metrics = {
      totalUsers,
      newUsersToday,
      totalRevenue,
      revenueGrowth,
      activeSubscriptions,
      pendingFeedback,
      systemHealth,
      recentActivities: formattedActivities
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkSystemHealth(): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    // Check database connectivity
    await prisma.user.count();
    
    // Check for any system-level issues
    const recentErrors = await prisma.adminActivity.count({
      where: {
        action: 'system_error',
        createdAt: {
          gte: subDays(new Date(), 1)
        }
      }
    });

    // Check if there are too many failed payments
    const failedPayments = await prisma.payment.count({
      where: {
        status: 'failed',
        createdAt: {
          gte: subDays(new Date(), 1)
        }
      }
    });

    if (recentErrors > 10 || failedPayments > 50) {
      return 'critical';
    } else if (recentErrors > 5 || failedPayments > 20) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    return 'critical';
  }
}

function getActivityDescription(action: string, details: any): string {
  switch (action) {
    case 'user_created':
      return 'New user registered';
    case 'user_suspended':
      return 'User account suspended';
    case 'user_activated':
      return 'User account activated';
    case 'payment_processed':
      return 'Payment processed successfully';
    case 'subscription_created':
      return 'New subscription created';
    case 'subscription_canceled':
      return 'Subscription canceled';
    case 'feedback_approved':
      return 'Feedback approved for display';
    case 'feedback_rejected':
      return 'Feedback rejected';
    case 'system_backup':
      return 'System backup completed';
    case 'system_error':
      return details?.message || 'System error occurred';
    default:
      return `Admin action: ${action}`;
  }
}