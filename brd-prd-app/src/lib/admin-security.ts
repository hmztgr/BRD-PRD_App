import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';

// Rate limiting store (in production, use Redis or external cache)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security constants
const RATE_LIMITS = {
  // Per-minute limits by endpoint type
  userManagement: 60,   // User CRUD operations
  analytics: 30,        // Analytics queries
  activity: 100,        // Activity logs
  actions: 20,          // User actions (suspend, etc.)
  default: 100          // Default limit
};

const SENSITIVE_ACTIONS = [
  'delete_user',
  'suspend',
  'change_role',
  'set_permissions'
];

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limiting middleware for admin APIs
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    identifier: string,
    endpointType: keyof typeof RATE_LIMITS = 'default'
  ): Promise<NextResponse | null> {
    const key = `${identifier}:${endpointType}`;
    const limit = RATE_LIMITS[endpointType];
    const now = Date.now();
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return null; // Allow request
    }
    
    if (current.count >= limit) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: new Date(current.resetTime).toISOString(),
          limit: limit
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString()
          }
        }
      );
    }
    
    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);
    
    return null; // Allow request
  };
}

/**
 * Input validation and sanitization
 */
export function validateAdminInput(data: any, schema: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required field check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip further validation if field is not present and not required
    if (value === undefined || value === null) continue;
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
      continue;
    }
    
    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }
    
    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }
    }
    
    // Array validations
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${field} must be an array`);
        continue;
      }
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${field} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${field} must have no more than ${rules.maxItems} items`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Security headers for admin API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}

/**
 * Sanitize sensitive data from API responses
 */
export function sanitizeResponse(data: any, sensitiveFields: string[] = []): any {
  if (!data) return data;
  
  const defaultSensitiveFields = ['password', 'stripeCustomerId', 'stripeSubscriptionId'];
  const fieldsToRemove = [...defaultSensitiveFields, ...sensitiveFields];
  
  function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = { ...obj };
      
      fieldsToRemove.forEach(field => {
        delete sanitized[field];
      });
      
      // Recursively sanitize nested objects
      Object.keys(sanitized).forEach(key => {
        sanitized[key] = sanitizeObject(sanitized[key]);
      });
      
      return sanitized;
    }
    
    return obj;
  }
  
  return sanitizeObject(data);
}

/**
 * Create comprehensive admin API middleware
 */
export function createAdminSecurityMiddleware(endpointType: keyof typeof RATE_LIMITS = 'default') {
  const rateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: RATE_LIMITS[endpointType]
  });
  
  return async function adminSecurityMiddleware(req: NextRequest): Promise<{
    adminUser: any;
    rateLimitResponse: NextResponse | null;
  }> {
    try {
      // 1. Verify admin authentication
      const adminUser = await requireAdmin();
      
      // 2. Apply rate limiting
      const rateLimitResponse = await rateLimiter(req, adminUser.id, endpointType);
      if (rateLimitResponse) {
        await logAdminActivity(
          adminUser.id,
          'rate_limit_exceeded',
          undefined,
          { 
            endpoint: req.url,
            method: req.method,
            endpointType,
            limit: RATE_LIMITS[endpointType]
          }
        );
        return { adminUser, rateLimitResponse };
      }
      
      // 3. Log API access for sensitive endpoints
      const url = new URL(req.url);
      const isSensitiveEndpoint = SENSITIVE_ACTIONS.some(action => 
        url.pathname.includes(action) || url.searchParams.has('action')
      );
      
      if (isSensitiveEndpoint) {
        await logAdminActivity(
          adminUser.id,
          'sensitive_endpoint_access',
          undefined,
          {
            endpoint: url.pathname,
            method: req.method,
            params: Object.fromEntries(url.searchParams),
            userAgent: req.headers.get('user-agent'),
            ip: req.headers.get('x-forwarded-for') || req.headers.get('remote-addr')
          }
        );
      }
      
      return { adminUser, rateLimitResponse: null };
      
    } catch (error: any) {
      throw error; // Re-throw to be handled by the calling API
    }
  };
}

/**
 * Validation schemas for common admin API inputs
 */
export const adminValidationSchemas = {
  createUser: {
    name: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    email: { 
      required: true, 
      type: 'string', 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 255
    },
    password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
    role: { 
      required: false, 
      type: 'string', 
      enum: ['user', 'admin', 'super_admin'] 
    },
    subscriptionTier: { 
      required: false, 
      type: 'string', 
      enum: ['free', 'professional', 'business', 'enterprise'] 
    }
  },
  
  updateUser: {
    name: { required: false, type: 'string', minLength: 1, maxLength: 100 },
    email: { 
      required: false, 
      type: 'string', 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 255
    },
    password: { required: false, type: 'string', minLength: 6, maxLength: 128 },
    role: { 
      required: false, 
      type: 'string', 
      enum: ['user', 'admin', 'super_admin'] 
    },
    subscriptionTier: { 
      required: false, 
      type: 'string', 
      enum: ['free', 'professional', 'business', 'enterprise'] 
    },
    tokensLimit: { required: false, type: 'number', min: 0, max: 10000000 }
  },
  
  userActions: {
    action: { 
      required: true, 
      type: 'string', 
      enum: ['suspend', 'activate', 'change_role', 'set_permissions', 'reset_tokens', 'adjust_tokens', 'verify_email'] 
    },
    reason: { required: false, type: 'string', maxLength: 500 },
    newRole: { 
      required: false, 
      type: 'string', 
      enum: ['user', 'admin', 'super_admin'] 
    },
    permissions: { 
      required: false, 
      type: 'array',
      maxItems: 10
    },
    tokensLimit: { required: false, type: 'number', min: 0, max: 10000000 }
  },
  
  pagination: {
    page: { required: false, type: 'number', min: 1, max: 10000 },
    limit: { required: false, type: 'number', min: 1, max: 200 }
  }
};

/**
 * Audit trail logging for critical admin actions
 */
export async function logCriticalAction(
  adminId: string,
  action: string,
  targetId: string | undefined,
  details: any,
  req: NextRequest
) {
  const auditData = {
    ...details,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('remote-addr'),
    endpoint: req.url,
    method: req.method
  };
  
  await logAdminActivity(adminId, `critical_${action}`, targetId, auditData);
  
  // In production, also log to external audit system
  console.log('CRITICAL_ADMIN_ACTION:', {
    adminId,
    action,
    targetId,
    auditData
  });
}

/**
 * Clean up rate limit store periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}