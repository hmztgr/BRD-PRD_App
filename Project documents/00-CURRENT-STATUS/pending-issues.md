# 🚨 **Pending Issues & Bug Reports**
## BRD/PRD Generator App - Active Issues Tracking

### 📋 **Document Overview**
- **Purpose**: Track identified issues, bugs, and required improvements
- **Status**: Active - Issues to be resolved
- **Priority**: High - User experience and business critical
- **Created**: January 5, 2025 (Updated from legacy issues)
- **Last Updated**: January 5, 2025
- **Verification Method**: Live Playwright testing completed

---

## 🔴 **CRITICAL ISSUES** (UNRESOLVED)

### **Issue #038: Database Connection Pool Exhaustion Causing Mock Data Fallback**
- **Category**: Database Performance & Infrastructure
- **Priority**: CRITICAL
- **Status**: PARTIALLY MITIGATED (Connection pool optimized, frontend fix needed)
- **Reported**: August 31, 2025

**Description:**
Admin dashboard and other API endpoints are experiencing severe database connection pool exhaustion, causing database queries to fail and fallback to mock data. The issue causes extremely slow page loads (15-20+ seconds) and unreliable data display.

**Root Cause Analysis:**
- Frontend making multiple concurrent requests (6+ times) to same API endpoints
- Each API request executes 4 database queries via Promise.all()
- Results in 24+ simultaneous database connections being requested
- Connection pool exhaustion occurs even with 20 connections configured
- Failed queries trigger mock data fallback in API routes

**Current Behavior:**
1. User navigates to admin dashboard
2. Frontend makes 6+ concurrent requests to `/api/admin/dashboard`
3. Each request attempts 4 database queries simultaneously
4. Connection pool gets exhausted (even at 20 connections)
5. Database queries timeout and fail
6. API falls back to mock data instead of real metrics
7. Page load times: 15-20+ seconds on localhost, 1-2+ minutes on production

**Expected Behavior:**
- Single API request per page load
- Real database data displayed
- Page loads in <2 seconds
- Reliable database connectivity

**Temporary Mitigation Applied:**
```env
DATABASE_URL="postgresql://postgres.jmfkzfmripuzfspijndq:Kx9KWdGOlh7WgEuT@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=15&pool_timeout=8&connect_timeout=8&statement_timeout=6000"
```

**Required Long-term Solution:**
1. **Frontend Optimization**: Prevent duplicate API calls on same page
2. **API Request Deduplication**: Implement request caching/deduplication
3. **Connection Pool Monitoring**: Add logging for connection usage
4. **Query Optimization**: Review and optimize database queries
5. **Error Handling**: Improve fallback strategies beyond mock data

**Priority Justification:**
CRITICAL - Application is essentially unusable for admin functions, showing fake data instead of real business metrics, and taking 15-20+ seconds per page load.

---

### **Issue #037: ACCOUNT_MANAGER Separate Interface Required**
- **Category**: Admin Interface & Authorization
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 31, 2025

**Description:**
ACCOUNT_MANAGER users should have a completely separate interface from the main admin panel. They should NOT have access to the /admin pages but should have their own dedicated account management interface.

**Current Behavior:**
- ACCOUNT_MANAGER users currently have access to main admin interface
- This provides more access than intended for their role

**Required Changes:**
1. **Create separate page/interface for ACCOUNT_MANAGER role**
2. **Remove ACCOUNT_MANAGER access from main admin interface**
3. **Design appropriate permissions and functionality for account management tasks**
4. **Implement dedicated routing for account management features**

**Files to Modify:**
- `src/lib/admin-auth.ts` - Remove admin access for ACCOUNT_MANAGER
- Create new account management interface components
- Add new routing for account management pages

---

### **Issue #035: Document Generation API Endpoint Missing**
- **Category**: Backend API & Document Generation
- **Priority**: CRITICAL
- **Status**: PENDING
- **Reported**: August 23, 2025

**Description:**
Multi-document generation fails due to missing API endpoint.

**Error Details:**
From console logs:
```
POST http://localhost:3000/api/documents/generate-multi 404 (Not Found)
Generation error: Error: Failed to generate Investor Pitch Deck
```

**Current Behavior:**
- User attempts document generation
- API returns 404 error
- Generation process fails completely

**Expected Behavior:**
- Successful document generation
- Multiple document types created
- Proper API endpoint functionality

**Technical Notes:**
- Missing /api/documents/generate-multi endpoint
- MultiDocumentGenerator component failing at line 412
- Core backend functionality not implemented

**Impact:**
- Document generation completely broken
- Core application functionality unavailable
- Primary app purpose not achievable

---

### **Issue #033: Research API Endpoint Missing**
- **Category**: Backend API & Research System
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 23, 2025

**Description:**
Research functionality fails due to missing API endpoint for research initiation.

**Error Details:**
From console logs:
```
POST http://localhost:3000/api/research/start 404 (Not Found)
Research error: Error: Research request failed
```

**Current Behavior:**
- User initiates research request
- API endpoint returns 404 error
- Research functionality completely broken

**Expected Behavior:**
- Successful research request processing
- Data gathering and analysis functionality
- Proper API endpoint implementation

**Technical Notes:**
- Missing /api/research/start endpoint
- Research system backend not implemented
- DataGatheringPanel component failing at line 309

**Impact:**
- Research functionality completely broken
- Advanced mode features unusable
- Core application feature missing

---

## 🟡 **HIGH PRIORITY ISSUES** (UNRESOLVED)

### **Issue #037: Missing Standard Mode Chat Implementation**
- **Category**: Core Functionality & Feature Parity
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 23, 2025

**Description:**
Standard mode chat page needs to be implemented with same UI as advanced mode but using simple logic.

**Current Requirements:**
- Identical UI to advanced mode chat
- All tabs present (Planning Chat, Upload Docs, Research, Progress, Generate)
- Use existing simple chat logic instead of advanced features
- Proper tier-appropriate functionality

**Current Status:**
- Standard mode chat not properly implemented
- Missing feature parity with advanced mode UI
- Need to create standard mode equivalent

**Expected Implementation:**
- Same visual interface as advanced mode
- Simplified backend logic for free/basic users
- Proper feature separation based on subscription tier

**Impact:**
- Inconsistent user experience between tiers
- Standard mode users lack full interface
- Feature gap between subscription levels

---

### **Issue #041: Subscription Validation Not Recognizing Professional User**
- **Category**: Access Control & Subscription Management
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 24, 2025

**Description:**
Professional test user is not recognized as having proper subscription tier, causing access restrictions despite valid professional account.

**Current Behavior:**
- Professional test user (test-pro@example.com) created with 'professional' tier
- "Switch to Advanced" button shows upgrade message even for professional user
- System redirects to pricing page despite valid subscription
- Access control validation fails

**Expected Behavior:**
- Professional users should access advanced mode without restrictions
- Subscription validation should recognize 'professional' tier
- No upgrade prompts for valid professional accounts

**Technical Notes:**
- Subscription fetching logic may not be working correctly
- Possible case sensitivity in tier comparison
- API endpoint /api/subscription/status may need verification
- Client-side subscription state not properly updated

**Impact:**
- Professional users cannot access paid features
- Subscription system not functioning correctly
- Revenue-affecting access control failure

---

## 🟠 **MEDIUM PRIORITY ISSUES** (UNRESOLVED)

### **Issue #002: Yearly Pricing Display Format**
- **Category**: UI/UX - Pricing Display
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 19, 2025

**Description:**
Yearly pricing display format is confusing and doesn't clearly show monthly equivalent pricing.

**Current Display:**
- Professional: "$34.20/year Save $11.40 (25% off)"
- Business: Similar format without monthly breakdown
- Enterprise: Similar format without monthly breakdown

**Desired Display Format:**
- Professional: "2.85/month (total payment $34.20/year) Save $11.40 (25% off)"
- Business: "[monthly]/month (total payment $[yearly]/year) Save $[savings] (25% off)"
- Enterprise: "[monthly]/month (total payment $[yearly]/year) Save $[savings] (25% off)"

**Impact:**
- Users may not understand actual monthly cost when paying yearly
- Pricing comparison becomes difficult
- Could affect conversion rates

---

### **Issue #003: Incorrect Savings Percentage Display**
- **Category**: UI/UX - Pricing Information
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 19, 2025

**Description:**
The pricing page shows "Save 15%" near the monthly/yearly toggle, but actual savings appear to be 25%.

**Current Display:**
- Toggle area shows "save 15%"

**Actual Calculation:**
- Savings appear to be 25% based on pricing structure
- Display should match actual savings percentage

**Required Action:**
- Verify actual savings percentage calculation
- Update display to show correct percentage (likely "Save 25%")

**Impact:**
- Misleading information to customers
- Could affect trust and purchasing decisions
- Inconsistent pricing messaging

---

### **Issue #021: Payment Testing Configuration**
- **Category**: E-commerce & Testing
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Payment system needs proper testing configuration for development and staging.

**Current Status:**
- Webhook connected to website
- Missing other payment testing steps
- Unclear testing capabilities

**Required Investigation:**
- Stripe test mode configuration
- Test payment methods setup
- Webhook endpoint testing
- Subscription flow testing

**Technical Notes:**
- Need Stripe test keys configuration
- Test card numbers setup
- Webhook event simulation
- End-to-end payment testing

**Impact:**
- Cannot test payment functionality
- Development workflow hindered
- Payment integration uncertainty

---

### **Issue #065: Website Name Needs Rebranding**
- **Category**: Branding & Identity
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 26, 2025

**Description:**
Website name needs to be changed to "Smart-Business-Docs-AI" to better reflect the application's expanded scope.

**Current Name:**
Current website name in header

**Requested Change:**
"Smart-Business-Docs-AI"

**Expected Implementation:**
- Update header component with new name
- Ensure consistent branding across all pages
- Update any references to old name

**Impact:**
- Better brand alignment with functionality
- Clear value proposition communication
- Professional rebranding

---

### **Issue #066: Logo Creation and Positioning**
- **Category**: Branding & UI/UX
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 26, 2025

**Description:**
Application needs a professional logo for the new "Smart-Business-Docs-AI" brand, and logo positioning needs adjustment.

**Requirements:**
- Create or suggest logo options for Smart-Business-Docs-AI
- Move logo positioning slightly to the right
- Ensure logo fits with dark theme design

**Expected Implementation:**
- Professional logo design
- Proper positioning in header
- Consistent branding elements

**Impact:**
- Professional brand identity
- Improved visual appeal
- Better brand recognition

---

## 🔵 **LOW PRIORITY ISSUES** (UNRESOLVED)

### **Issue #004: Document Limits Placement and Clarity**
- **Category**: UI/UX - Information Architecture
- **Priority**: LOW
- **Status**: PENDING
- **Reported**: August 19, 2025

**Description:**
Document limits information is displayed separately from token limits, making pricing structure less clear.

**Current Display:**
- Separate bullets for document limits: "Limited to 3-6 documents per month", "Up to 65-130 documents per month"
- Separate bullets for token limits: "50K tokens per month", "200K tokens per month"

**Desired Display:**
- Combined format: "50K tokens per month (3-6 documents)", "200K tokens per month (65-130 documents)"
- Or group related information together

**Impact:**
- Information architecture could be clearer
- Easier comparison between tiers
- Better user understanding of limits

---

## 🟢 **BUSINESS POLICY ISSUES** (UNRESOLVED)

### **Issue #005: Problematic FAQ Content**
- **Category**: Business Policy & Content
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 19, 2025

**Description:**
Several FAQ items contain problematic content that could create business issues or provide misleading information.

#### **Sub-issue 5A: Refund Policy Risk**
**Current Content:**
"Do you offer refunds? We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not satisfied."

**Problem:**
- Users could generate documents then request refunds
- Creates potential for abuse of service
- High business risk with AI usage costs

**Recommended Action:**
- Remove money-back guarantee
- Replace with different satisfaction policy
- Consider usage-based refund limitations

#### **Sub-issue 5B: Misleading Token Explanation**
**Current Content:**
"What are tokens? Tokens measure AI usage for document generation. Typically, 1,000 tokens = 1 standard business document. Your token limit resets monthly."

**Problem:**
- Misleading conversion rate (1,000 tokens ≠ 1 document reliably)
- Oversimplified explanation of token usage
- Could lead to customer disappointment

**Recommended Action:**
- Either provide accurate, detailed token explanation
- Or remove the specific conversion ratio
- Focus on token limits per tier instead

#### **Sub-issue 5C: Downgrade Policy Inaccuracy**
**Current Content:**
"Can I upgrade or downgrade anytime? Yes! You can change your plan anytime through your account settings. Changes take effect immediately with prorated billing."

**Problem:**
- Downgrade should not take effect immediately
- Should start at next billing period to prevent abuse
- Upgrade immediate is fine, downgrade should be delayed

**Recommended Action:**
- Update policy: "Upgrades take effect immediately. Downgrades take effect at your next billing period."
- Implement proper downgrade timing in billing system

**Impact:**
- High business risk with current refund policy
- Customer confusion with token explanation
- Billing system complexity with immediate downgrades

---

### **Issue #008: Subscription Buttons Lead to 404 Errors**
- **Category**: E-commerce & Navigation
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Subscription plan buttons redirect to non-existent URLs causing 404 errors.

**Current Behavior:**
- "Start Free Trial" button redirects to `/auth/signin?callbackUrl=%2Fpricing`
- URL results in 404 error page
- Subscription flow completely broken

**Expected Behavior:**
- Should redirect to proper authentication flow
- After auth, should initiate subscription process
- Seamless subscription experience

**Technical Notes:**
- Incorrect auth callback URL structure
- Missing auth pages for subscription flow
- Subscription integration not properly configured

**Impact:**
- Broken monetization flow
- Lost potential customers
- Revenue impact

---

### **Issue #011: Checkout Session Creation Failure**
- **Category**: E-commerce & Payment Processing
- **Priority**: CRITICAL
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Business tier subscription fails with console error during checkout session creation.

**Error Message:**
```
Failed to create checkout session

Call Stack
1. handleSubscribe
.next\\static\\chunks\\src_d7805f35._.js (218:23)
```

**Current Behavior:**
- User clicks subscribe to business tier
- Checkout session creation fails
- Payment flow completely broken

**Expected Behavior:**
- Successful checkout session creation
- Redirect to payment processor
- Complete subscription flow

**Technical Notes:**
- Error in handleSubscribe function
- Likely Stripe integration issue
- Payment processor configuration problem

**Impact:**
- Revenue blocking issue
- Complete subscription failure
- Critical business functionality broken

---

## 📊 **SUMMARY STATISTICS**

- **Total Active Issues**: 16
- **Critical Issues**: 4
- **High Priority**: 6  
- **Medium Priority**: 4
- **Low Priority**: 1
- **Business Policy**: 3

**Most Critical Areas Requiring Attention:**
1. Database connection pool issues
2. Missing API endpoints (document generation, research)
3. Payment system configuration
4. Subscription validation logic
5. Feature parity between modes

---

**🔄 Last Updated**: January 5, 2025  
**👤 Verification Method**: Live Playwright testing completed  
**🎯 Next Review**: After critical API endpoints implementation