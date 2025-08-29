import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';

// GET /api/admin/analytics/system - System health and usage statistics
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
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get database metrics
    const totalDocuments = await prisma.document.count();
    const totalTemplates = await prisma.template.count();
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();

    // Get system usage statistics
    const usageStats = await prisma.usageHistory.aggregate({
      where: {
        date: {
          gte: startDate
        }
      },
      _sum: {
        tokensUsed: true
      },
      _count: {
        id: true
      }
    });

    // Get usage breakdown by operation
    const usageByOperation = await prisma.usageHistory.groupBy({
      by: ['operation'],
      where: {
        date: {
          gte: startDate
        }
      },
      _sum: {
        tokensUsed: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          tokensUsed: 'desc'
        }
      }
    });

    // Get AI model usage statistics
    const aiModelUsage = await prisma.usageHistory.groupBy({
      by: ['aiModel'],
      where: {
        date: {
          gte: startDate
        },
        aiModel: {
          not: null
        }
      },
      _sum: {
        tokensUsed: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          tokensUsed: 'desc'
        }
      }
    });

    // Get document generation statistics
    const documentStats = await prisma.document.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get error rates
    const errorRate = await prisma.usageHistory.groupBy({
      by: ['success'],
      where: {
        date: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const totalRequests = errorRate.reduce((sum, stat) => sum + stat._count.id, 0);
    const failedRequests = errorRate.find(stat => stat.success === false)?._count.id || 0;
    const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests) * 100 : 100;

    // Get daily usage trends
    const dailyUsage = await prisma.$queryRaw<Array<{date: string, tokens: bigint, operations: bigint}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', date), 'YYYY-MM-DD') as date,
        SUM("tokensUsed") as tokens,
        COUNT(*) as operations
      FROM "usage_history"
      WHERE date >= ${startDate}
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY DATE_TRUNC('day', date)
    `;

    // Get peak usage hours
    const peakHours = await prisma.$queryRaw<Array<{hour: number, operations: bigint}>>`
      SELECT 
        EXTRACT(hour FROM date) as hour,
        COUNT(*) as operations
      FROM "usage_history"
      WHERE date >= ${startDate}
      GROUP BY EXTRACT(hour FROM date)
      ORDER BY COUNT(*) DESC
      LIMIT 24
    `;

    // Get storage metrics
    const storageMetrics = await prisma.$queryRaw<Array<{
      table_name: string,
      size_bytes: bigint,
      row_count: bigint
    }>>`
      SELECT 
        schemaname,
        tablename as table_name,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        n_tup_ins as row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;

    // Get feedback and support metrics
    const feedbackStats = await prisma.feedback.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const contactRequestStats = await prisma.contactRequest.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const supportTicketStats = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get referral system metrics
    const referralStats = await prisma.referralReward.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        tokens: true
      },
      _count: {
        id: true
      }
    });

    // Get top performing users (by document creation)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: {
        documents: {
          _count: 'desc'
        }
      },
      take: 10
    });

    await logAdminActivity(
      adminUser.id,
      'view_system_analytics',
      undefined,
      { period }
    );

    return NextResponse.json({
      overview: {
        totalDocuments,
        totalTemplates,
        totalConversations,
        totalMessages,
        totalTokensUsed: Number(usageStats._sum.tokensUsed || 0),
        totalOperations: usageStats._count.id,
        successRate: Math.round(successRate * 100) / 100
      },
      usage: {
        byOperation: usageByOperation.map(op => ({
          operation: op.operation,
          tokens: Number(op._sum.tokensUsed || 0),
          count: op._count.id
        })),
        byAiModel: aiModelUsage.map(model => ({
          model: model.aiModel,
          tokens: Number(model._sum.tokensUsed || 0),
          count: model._count.id
        })),
        dailyTrends: dailyUsage.map(day => ({
          date: day.date,
          tokens: Number(day.tokens),
          operations: Number(day.operations)
        })),
        peakHours: peakHours.map(hour => ({
          hour: Number(hour.hour),
          operations: Number(hour.operations)
        }))
      },
      documents: {
        byType: documentStats.map(doc => ({
          type: doc.type,
          count: doc._count.id
        }))
      },
      storage: {
        byTable: storageMetrics.map(table => ({
          tableName: table.table_name,
          sizeBytes: Number(table.size_bytes),
          rowCount: Number(table.row_count),
          sizeMB: Math.round(Number(table.size_bytes) / (1024 * 1024) * 100) / 100
        }))
      },
      support: {
        feedback: feedbackStats.map(f => ({
          status: f.status,
          count: f._count.id
        })),
        contactRequests: contactRequestStats.map(c => ({
          status: c.status,
          count: c._count.id
        })),
        supportTickets: supportTicketStats.map(s => ({
          status: s.status,
          count: s._count.id
        }))
      },
      referrals: {
        byType: referralStats.map(r => ({
          type: r.type,
          tokens: Number(r._sum.tokens || 0),
          count: r._count.id
        }))
      },
      topUsers: topUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        documentCount: user._count.documents
      }))
    });

  } catch (error: any) {
    console.error('Admin system analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}