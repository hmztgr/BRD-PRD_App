# Admin API Documentation

## Overview

The Admin API provides comprehensive backend infrastructure for managing users, viewing analytics, monitoring system health, and tracking admin activities. All endpoints require admin authentication and implement proper security measures including rate limiting, input validation, and audit logging.

## Authentication

All admin API endpoints require authentication via the admin authentication middleware. Users must have `admin` or `super_admin` role, with specific permissions checked per endpoint.

### Admin Permissions
- `manage_users`: User management operations
- `manage_feedback`: Feedback and support management  
- `manage_content`: Content and document management
- `manage_subscriptions`: Subscription and payment management
- `view_analytics`: Analytics and reporting access
- `manage_system`: System configuration and maintenance

## Rate Limiting

API endpoints are rate-limited per admin user:
- User Management: 60 requests/minute
- Analytics: 30 requests/minute  
- Activity Logs: 100 requests/minute
- User Actions: 20 requests/minute
- Default: 100 requests/minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Window reset timestamp

## Security Features

- **Input Validation**: All inputs validated against predefined schemas
- **Sanitization**: Sensitive data automatically removed from responses
- **Audit Logging**: All admin activities logged to `AdminActivity` model
- **Permission Checks**: Granular permission validation per endpoint
- **Rate Limiting**: Protection against API abuse
- **Security Headers**: Comprehensive security headers on all responses

---

## User Management API

### GET /api/admin/users

List users with pagination and filtering.

**Required Permission**: `manage_users`

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search in name, email, company
- `role` (string, optional): Filter by role
- `subscriptionTier` (string, optional): Filter by subscription tier
- `sortBy` (string, optional): Sort field (default: createdAt)
- `sortOrder` (string, optional): Sort direction (default: desc)

**Response**: `AdminUsersListResponse`

```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": "2023-01-01T00:00:00Z",
      "role": "user",
      "subscriptionTier": "professional",
      "subscriptionStatus": "active",
      "tokensUsed": 5000,
      "tokensLimit": 100000,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "companyName": "Acme Corp",
      "industry": "Technology",
      "language": "en",
      "_count": {
        "documents": 15,
        "referrals": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### POST /api/admin/users

Create a new user.

**Required Permission**: `manage_users`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "user",
  "subscriptionTier": "free",
  "companyName": "Acme Corp",
  "industry": "Technology",
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "subscriptionTier": "free",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### GET /api/admin/users/[id]

Get detailed user information.

**Required Permission**: `manage_users`

**Response**: `AdminUserResponse`

```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    // ... all user fields
    "_count": {
      "documents": 15,
      "referrals": 3,
      "usageHistory": 50,
      "payments": 5
    },
    "usageHistory": [
      {
        "id": "usage_id",
        "date": "2023-01-01T00:00:00Z",
        "tokensUsed": 1000,
        "operation": "document_generation",
        "aiModel": "gpt-4",
        "success": true
      }
    ],
    "payments": [
      {
        "id": "payment_id",
        "amount": 2900,
        "currency": "usd",
        "status": "succeeded",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

### PUT /api/admin/users/[id]

Update user information.

**Required Permission**: `manage_users`

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "role": "admin",
  "subscriptionTier": "professional",
  "subscriptionStatus": "active",
  "tokensLimit": 200000,
  "companyName": "New Company",
  "industry": "Healthcare",
  "language": "ar",
  "password": "newpassword"
}
```

### DELETE /api/admin/users/[id]

Delete a user (cannot delete own account or other admins unless super_admin).

**Required Permission**: `manage_users`

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### POST /api/admin/users/[id]/actions

Perform user actions (suspend, activate, change role, etc.).

**Required Permission**: `manage_users`

**Request Body**:
```json
{
  "action": "suspend",
  "reason": "Policy violation",
  "newRole": "user",
  "permissions": ["manage_users", "view_analytics"],
  "tokensLimit": 50000
}
```

**Available Actions**:
- `suspend`: Suspend user account
- `activate`: Activate suspended account
- `change_role`: Change user role
- `set_permissions`: Set admin permissions
- `reset_tokens`: Reset token usage to 0
- `adjust_tokens`: Change token limit
- `verify_email`: Manually verify email

**Response**: `AdminActionResponse`

---

## Analytics API

### GET /api/admin/analytics/users

Get user analytics and growth metrics.

**Required Permission**: `view_analytics`

**Query Parameters**:
- `period` (string, optional): Time period (7d, 30d, 90d, 1y) (default: 30d)
- `timezone` (string, optional): Timezone for date calculations (default: UTC)

**Response**: `UserAnalyticsResponse`

```json
{
  "overview": {
    "totalUsers": 1000,
    "activeUsers": 250,
    "verifiedUsers": 800,
    "unverifiedUsers": 200
  },
  "registrations": [
    {
      "date": "2023-01-01",
      "count": 25
    }
  ],
  "subscriptionDistribution": [
    {
      "tier": "free",
      "count": 700
    },
    {
      "tier": "professional",
      "count": 250
    }
  ],
  "roleDistribution": [
    {
      "role": "user",
      "count": 980
    }
  ],
  "topIndustries": [
    {
      "industry": "Technology",
      "count": 300
    }
  ],
  "languageDistribution": [
    {
      "language": "en",
      "count": 600
    },
    {
      "language": "ar",
      "count": 400
    }
  ],
  "retention": [
    {
      "cohort": "2023-01",
      "totalUsers": 100,
      "retainedUsers": 75,
      "retentionRate": 75.0
    }
  ]
}
```

### GET /api/admin/analytics/subscriptions

Get subscription and revenue analytics.

**Required Permission**: `view_analytics`

**Query Parameters**:
- `period` (string, optional): Time period (7d, 30d, 90d, 1y) (default: 30d)
- `currency` (string, optional): Currency filter (default: usd)

**Response**: `SubscriptionAnalyticsResponse`

```json
{
  "overview": {
    "totalMRR": 25000,
    "totalRevenue": 100000,
    "totalPayments": 500,
    "failedPayments": 10,
    "arpu": 125.50,
    "activeSubscribers": 200
  },
  "mrrByTier": {
    "professional": 15000,
    "business": 8000,
    "enterprise": 2000
  },
  "revenueOverTime": [
    {
      "date": "2023-01-01",
      "amount": 5000,
      "count": 20
    }
  ],
  "subscriptionTransitions": [
    {
      "fromTier": "free",
      "toTier": "professional",
      "count": 15
    }
  ],
  "churnAnalysis": [
    {
      "tier": "professional",
      "count": 5
    }
  ],
  "conversionFunnel": [
    {
      "cohort": "2023-01",
      "totalSignups": 100,
      "convertedToPaid": 25,
      "conversionRate": 25.0
    }
  ]
}
```

### GET /api/admin/analytics/system

Get system health and usage statistics.

**Required Permission**: `view_analytics`

**Query Parameters**:
- `period` (string, optional): Time period (7d, 30d, 90d) (default: 30d)

**Response**: `SystemAnalyticsResponse`

```json
{
  "overview": {
    "totalDocuments": 5000,
    "totalTemplates": 50,
    "totalConversations": 2000,
    "totalMessages": 10000,
    "totalTokensUsed": 1000000,
    "totalOperations": 15000,
    "successRate": 98.5
  },
  "usage": {
    "byOperation": [
      {
        "operation": "document_generation",
        "tokens": 500000,
        "count": 5000
      }
    ],
    "byAiModel": [
      {
        "model": "gpt-4",
        "tokens": 600000,
        "count": 6000
      }
    ],
    "dailyTrends": [
      {
        "date": "2023-01-01",
        "tokens": 50000,
        "operations": 500
      }
    ],
    "peakHours": [
      {
        "hour": 14,
        "operations": 1000
      }
    ]
  },
  "storage": {
    "byTable": [
      {
        "tableName": "documents",
        "sizeBytes": 1073741824,
        "rowCount": 5000,
        "sizeMB": 1024.0
      }
    ]
  },
  "topUsers": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionTier": "professional",
      "documentCount": 50
    }
  ]
}
```

---

## Admin Activity API

### GET /api/admin/activity

Get admin activity logs with filtering and pagination.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 200)
- `adminId` (string, optional): Filter by admin ID
- `action` (string, optional): Filter by action (partial match)
- `targetId` (string, optional): Filter by target resource ID
- `startDate` (string, optional): Start date filter (ISO string)
- `endDate` (string, optional): End date filter (ISO string)

**Response**: `AdminActivityResponse`

```json
{
  "activities": [
    {
      "id": "activity_id",
      "action": "update_user",
      "targetId": "user_id",
      "details": {
        "updatedFields": ["role", "subscriptionTier"]
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "admin": {
        "id": "admin_id",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 500,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "summary": {
    "byAction": [
      {
        "action": "update_user",
        "count": 100
      }
    ],
    "byAdmin": [
      {
        "adminId": "admin_id",
        "admin": {
          "id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin"
        },
        "activityCount": 150
      }
    ],
    "trends": [
      {
        "date": "2023-01-01",
        "count": 25
      }
    ]
  },
  "permissions": {
    "canViewAllActivities": true
  }
}
```

### POST /api/admin/activity

Manually log admin activity (for external integrations).

**Request Body**:
```json
{
  "action": "custom_action",
  "targetId": "resource_id",
  "details": {
    "customData": "value"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

**Common HTTP Status Codes**:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Admin authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

---

## Database Schema Requirements

### Required Models

The admin API relies on these Prisma models:

```prisma
model User {
  // ... existing fields
  role               String    @default("user") // "user", "admin", "super_admin"
  adminPermissions   Json?     // Array of AdminPermission strings
  // ... other fields
}

model AdminActivity {
  id        String   @id @default(cuid())
  adminId   String
  action    String
  targetId  String?
  details   Json?
  createdAt DateTime @default(now())
  
  admin     User     @relation(fields: [adminId], references: [id], onDelete: Cascade)
}
```

---

## Security Considerations

### Audit Logging
All admin activities are automatically logged including:
- User management operations
- Permission changes
- Critical system actions
- Failed authentication attempts
- Rate limit violations

### Data Protection
- Sensitive fields automatically removed from responses
- Password fields never returned in API responses
- Stripe customer data protected
- User PII handling follows security guidelines

### Access Control
- Role-based permissions with inheritance
- Super admin can perform all actions
- Regular admins restricted by permission grants
- Self-modification protections (cannot delete/demote self)

### Rate Limiting
- Endpoint-specific rate limits
- Per-admin user tracking
- Automatic cleanup of expired rate limit data
- Headers provided for client rate limit awareness

This documentation provides a complete reference for all admin API endpoints, including request/response formats, security measures, and implementation details for frontend integration.