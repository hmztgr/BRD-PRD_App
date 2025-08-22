# 🚨 **Pending Issues & Bug Reports**
## BRD/PRD Generator App - Issues Tracking

### 📋 **Document Overview**
- **Purpose**: Track identified issues, bugs, and required improvements
- **Status**: Active - Issues to be resolved
- **Priority**: High - User experience and business critical
- **Created**: August 19, 2025
- **Last Updated**: August 19, 2025

---

## 🔴 **CRITICAL ISSUES**

### **Issue #001: Language Toggle Logout Bug**
- **Category**: Authentication & Internationalization
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 19, 2025

**Description:**
When user is logged into the Arabic dashboard and presses the language toggle button, the system logs them out and redirects to the English homepage instead of keeping them logged in and switching to the English dashboard.

**Expected Behavior:**
- User should remain logged in when switching languages
- Should redirect to equivalent page in new language (Arabic dashboard → English dashboard)
- Session should be preserved across language changes

**Current Behavior:**
- User gets logged out
- Redirected to English homepage
- Must log in again to access dashboard

**Technical Notes:**
- Issue likely in language switcher implementation in header component
- May be related to session handling during locale changes
- Affects user experience significantly

**Impact:**
- Major user experience disruption
- Could discourage bilingual usage
- Breaks expected internationalization behavior

---

## 🟡 **PRICING PAGE ISSUES**

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

### **Issue #006: Authentication Bypass in Protected Routes**
- **Category**: Security & Authentication
- **Priority**: CRITICAL
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Dashboard and Documents pages are accessible without authentication, creating a major security vulnerability.

**Current Behavior:**
- Clicking "Dashboard" when not logged in opens dashboard page
- Clicking "Documents" when not logged in attempts to access documents
- No authentication check or redirect to login

**Expected Behavior:**
- Should redirect to login page when accessing protected routes
- After login, should redirect back to originally requested page
- Proper authentication middleware protection

**Technical Notes:**
- Missing NextAuth middleware configuration
- No route protection implemented
- Security vulnerability allowing unauthorized access

**Impact:**
- Critical security vulnerability
- Unauthorized access to user features
- Potential data exposure risk

---

### **Issue #007: Language Toggle Ignores Current Page**
- **Category**: Internationalization & Navigation
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Language toggle always redirects to homepage instead of preserving current page context.

**Current Behavior:**
- User on `/en/dashboard` clicks Arabic toggle → goes to `/ar` (homepage)
- User on `/en/pricing` clicks Arabic toggle → goes to `/ar` (homepage)
- Context completely lost during language switch

**Expected Behavior:**
- User on `/en/dashboard` clicks Arabic toggle → goes to `/ar/dashboard`
- User on `/en/pricing` clicks Arabic toggle → goes to `/ar/pricing`
- Preserve current page context during language switch

**Technical Notes:**
- SimpleHeader hardcoded links to `/en` and `/ar`
- Need dynamic path preservation logic
- Current implementation in lines 48-59 of simple-header.tsx

**Impact:**
- Poor user experience
- Navigation disruption
- Discourages language switching

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

### **Issue #009: Missing Contact and Feedback Features**
- **Category**: Customer Support & Business Operations
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Application lacks essential customer feedback and contact mechanisms.

**Missing Features:**
- Contact Us page/form
- Customer feedback system
- User reviews/testimonials section
- Support chat functionality
- Admin management interface

**Business Impact:**
- No customer support channel
- No user feedback collection
- No testimonial/social proof system
- No admin oversight capabilities

**Required Implementation:**
- Contact system with email and AI chat
- Feedback system with admin approval
- Homepage testimonial section
- Admin dashboard for management
- AI chat support with ticket creation

---

### **Issue #010: Incomplete Pricing Tier Structure**
- **Category**: Business Model & Pricing
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Current pricing structure lacks a premium tier for solo professionals requiring advanced AI models.

**Current Structure:**
- Free, Professional, Business, Enterprise
- Gap between Professional ($3.80) and Business ($9.80)
- No premium AI model access for individual users

**Requested Structure:**
- Free, Hobby ($3.80, renamed Professional), Professional ($19.80, NEW), Business ($9.80), Enterprise ($39.80)
- New Professional tier for premium AI models (GPT-4, Claude-3 Opus)
- Better price points for different user segments

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
.next\static\chunks\src_d7805f35._.js (218:23)
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

### **Issue #012: Authentication State Display Bug**
- **Category**: Authentication & UI State
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
After successful sign-in, UI still shows "Sign In" instead of showing logged-in state.

**Current Behavior:**
- User signs in successfully
- Authentication completes
- UI continues showing "Sign In" button
- User state not reflected in interface

**Expected Behavior:**
- Show user profile/name after login
- Display "Sign Out" option
- Update navigation to show authenticated state
- Proper session state management

**Technical Notes:**
- NextAuth session not updating UI
- Component state synchronization issue
- Possible client-side hydration problem

**Impact:**
- User confusion about login status
- Poor user experience
- Authentication flow appears broken

---

### **Issue #013: Referral Dashboard 404 Error**
- **Category**: Navigation & Routing
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
"View Referral Dashboard" button redirects to non-existent page causing 404 error.

**Current Behavior:**
- Click "View Referral Dashboard"
- Results in 404 error page
- Referral system inaccessible

**Expected Behavior:**
- Navigate to functional referral dashboard
- Display referral tracking and statistics
- Allow referral link generation

**Technical Notes:**
- Missing referral dashboard route
- Page component not implemented
- Navigation link incorrect

**Impact:**
- Referral system unusable
- Lost referral opportunities
- Feature completely broken

---

### **Issue #014: Documents Page 404 Error**
- **Category**: Core Functionality & Routing
- **Priority**: CRITICAL
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Documents page returns 404 error, breaking core application functionality.

**Current Behavior:**
- Navigate to documents page
- Returns 404 error
- Core feature inaccessible

**Expected Behavior:**
- Display user's generated documents
- Allow document management
- Show document creation interface

**Technical Notes:**
- Missing documents page route
- Core functionality not implemented
- Critical application feature broken

**Impact:**
- Core application feature broken
- Document management impossible
- Major functionality loss

---

### **Issue #015: Settings Page 404 Error**
- **Category**: User Management & Routing
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Settings button leads to 404 error, preventing user account management.

**Current Behavior:**
- Click settings button
- Results in 404 error
- Settings inaccessible

**Expected Behavior:**
- Display user settings page
- Allow profile management
- Show subscription settings

**Technical Notes:**
- Missing settings page route
- User management interface not implemented
- Account management broken

**Impact:**
- User account management impossible
- No profile/subscription control
- User experience severely limited

---

### **Issue #016: Feedback Page Build Error**
- **Category**: Build System & Dependencies
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Feedback page fails to build due to missing UI component dependency.

**Error Message:**
```
Module not found: Can't resolve '@/components/ui/alert'

./src/components/feedback/feedback-form.tsx (12:1)
> 12 | import { Alert, AlertDescription } from '@/components/ui/alert'
```

**Current Behavior:**
- Feedback page build fails
- Missing alert component
- Page completely inaccessible

**Expected Behavior:**
- Successful page build
- Functional feedback form
- Working alert components

**Technical Notes:**
- Missing @/components/ui/alert component
- Incomplete shadcn/ui installation
- Component dependency not satisfied

**Impact:**
- Feedback system broken
- Customer feedback collection impossible
- Build process failing

---

### **Issue #017: Feedback Display Transparency Statements**
- **Category**: Content & User Interface
- **Priority**: LOW
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Feedback display contains unnecessary transparency statements that should be removed.

**Current Text:**
```
Full Transparency
All approved reviews are displayed publicly to help others make informed decisions

Note: All feedback is reviewed by our team before publication to ensure quality and authenticity.
```

**Required Action:**
- Remove these transparency statements entirely
- Keep feedback display clean and simple

**Impact:**
- Cleaner user interface
- Less cluttered feedback section

---

### **Issue #018: Settings Navigation Inconsistency**
- **Category**: Navigation & Routing
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Settings button works from user profile dropdown but results in 404 when clicked from dashboard page.

**Current Behavior:**
- Settings button in user profile dropdown: Works correctly
- Settings button from dashboard page: Results in 404 error
- Inconsistent navigation behavior

**Expected Behavior:**
- Both settings buttons should navigate to same functional settings page
- Consistent navigation behavior across all pages

**Technical Notes:**
- Different routing implementations for same feature
- Dashboard settings button may have incorrect route

**Impact:**
- User confusion about navigation
- Inconsistent user experience
- Feature accessibility issues

---

### **Issue #019: Contact Form Dropdown Transparency**
- **Category**: UI/UX - Form Elements
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
General inquiry dropdown in contact form has transparent background making text unreadable.

**Current Behavior:**
- Dropdown options have transparent background
- Text becomes unreadable against page background
- Poor user experience with form interaction

**Expected Behavior:**
- Dropdown should have solid background
- Text should be clearly readable
- Proper contrast and visibility

**Technical Notes:**
- CSS styling issue with dropdown component
- Background transparency not properly configured
- Accessibility concern

**Impact:**
- Form unusable in current state
- Contact system affected
- Poor accessibility

---

### **Issue #020: Settings Page Color Scheme**
- **Category**: UI/UX - Visual Design
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Settings page has white background with white text making content unreadable.

**Current Behavior:**
- White background with white text
- Content completely unreadable
- Inconsistent with other page designs

**Expected Behavior:**
- Consistent background and text colors
- Match design scheme of other pages
- Proper contrast for readability

**Technical Notes:**
- CSS theming not applied correctly
- Color scheme inconsistency
- Styling inheritance issue

**Impact:**
- Settings page completely unusable
- Poor user experience
- Design inconsistency

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

### **Issue #022: Pricing Page Trial Text for Existing Users**
- **Category**: User Experience & Pricing
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Pricing page shows "Start Free Trial" even for users who already have professional tier subscription.

**Current Behavior:**
- User has "(professional tier)" shown in dashboard
- Pricing page still shows "Start Free Trial" button
- Confusing messaging for existing subscribers

**Expected Behavior:**
- Show appropriate text for existing subscribers
- "Upgrade to Business" or "Switch Plan" instead
- Context-aware pricing display

**Technical Notes:**
- Need subscription status detection
- Dynamic button text based on user tier
- User context awareness in pricing component

**Impact:**
- Confusing user experience
- Inappropriate call-to-action for existing users
- May discourage upgrades

---

### **Issue #023: Page Background Inconsistency**
- **Category**: UI/UX - Visual Design
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Multiple pages have white backgrounds instead of consistent dark/gray background theme used by other pages like dashboard.

**Affected Pages:**
- http://localhost:3005/en/referral
- http://localhost:3005/en/contact
- http://localhost:3005/en/feedback
- http://localhost:3005/en/settings

**Current Behavior:**
- These pages display with white backgrounds
- Inconsistent with dashboard and other main pages
- Creates jarring visual experience when navigating

**Expected Behavior:**
- All pages should have consistent background styling
- Match dashboard's dark/gray theme
- Seamless visual experience across all pages

**Technical Notes:**
- Need to update background classes to match dashboard
- Ensure proper theme consistency
- Review CSS inheritance and styling

**Impact:**
- Poor visual consistency
- Unprofessional appearance
- Confusing user experience

---

### **Issue #024: Locale-Missing Routing in Dashboard Links**
- **Category**: Internationalization & Navigation
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Dashboard page buttons are missing locale prefix in their URLs, causing 404 errors.

**Current Behavior:**
- Settings button in dashboard → `/settings` (404 error)
- New document button → `/documents/new` (404 error)
- Referral button → `/referrals` (404 error)
- Missing locale prefix (`en/` or `ar/`)

**Expected Behavior:**
- Settings button → `/en/settings` or `/ar/settings`
- New document button → `/en/documents/new` or `/ar/documents/new`
- Referral button → `/en/referral` or `/ar/referral`
- Proper locale-aware routing

**Comparison:**
- User profile dropdown settings button works correctly → `/en/settings`
- Dashboard buttons missing locale → `/settings` (broken)

**Technical Notes:**
- Dashboard page links not using locale context
- Need to inject current locale into navigation URLs
- Issue in dashboard page.tsx button links

**Impact:**
- Broken navigation from dashboard
- Core functionality inaccessible
- Poor user experience

---

### **Issue #025: Documents New Page 404 Error**
- **Category**: Core Functionality & Routing
- **Priority**: CRITICAL
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Documents creation page returns 404 error when accessed without proper locale prefix.

**Current Behavior:**
- Direct access to `/documents/new` → 404 error
- Manual access to `/en/documents/new` → Works correctly
- Dashboard "New Document" button leads to broken URL

**Expected Behavior:**
- All document creation links should include locale
- Seamless navigation to document creation
- Proper route configuration

**Technical Notes:**
- Route exists at `/[locale]/documents/new`
- Missing route for `/documents/new` without locale
- Dashboard button needs locale awareness

**Impact:**
- Core document creation feature broken
- Primary app functionality inaccessible
- User cannot create documents from dashboard

---

### **Issue #026: Arabic Interface Routing Issues**
- **Category**: Internationalization & Navigation
- **Priority**: HIGH
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Arabic interface has similar routing issues where buttons lead to pages without the "ar/" locale prefix.

**Current Behavior:**
- Multiple dashboard buttons in Arabic interface missing `ar/` prefix
- Similar 404 errors as English interface
- Broken navigation throughout Arabic version

**Expected Behavior:**
- All Arabic interface buttons should include `ar/` prefix
- Consistent locale-aware routing for both languages
- Working navigation in both English and Arabic

**Technical Notes:**
- Same root cause as English interface issues
- Need to fix locale injection for both `en` and `ar`
- Comprehensive solution needed for both languages

**Impact:**
- Arabic interface largely unusable
- International users cannot navigate properly
- Bilingual feature broken

---

## 📊 **ISSUE SUMMARY**

### **By Priority:**
- **CRITICAL Priority**: 4 issues (Authentication bypass #006, Checkout failure #011, Documents page #014, Documents new page #025)
- **HIGH Priority**: 11 issues (Language toggle logout #001, FAQ policies #005, Subscription 404s #008, Missing contact/feedback #009, Auth state display #012, Settings page #015, Feedback build error #016, Settings navigation #018, Payment testing #021, Dashboard routing #024, Arabic routing #026)
- **MEDIUM Priority**: 8 issues (Pricing display #002, savings percentage #003, Pricing tier structure #010, Referral dashboard #013, Contact dropdown #019, Settings color scheme #020, Pricing trial text #022, Page background consistency #023)
- **LOW Priority**: 2 issues (Information architecture #004, Feedback transparency #017)

### **By Category:**
- **Authentication & Security**: 3 issues (#001, #006, #012)
- **Core Functionality & Routing**: 4 issues (#008, #013, #014, #015)
- **E-commerce & Payment**: 2 issues (#008, #011)
- **UI/UX - Pricing**: 3 issues (#002, #003, #010)
- **Business Policy & Content**: 2 issues (#005, #009)
- **Build System & Dependencies**: 1 issue (#016)
- **Internationalization**: 1 issue (#007)

### **Implementation Priority Order:**
1. **Issue #016**: Feedback page build error (Blocking development)
2. **Issue #006**: Authentication bypass security vulnerability (Critical security)
3. **Issue #014**: Documents page 404 error (Core functionality broken)
4. **Issue #011**: Checkout session creation failure (Revenue blocking)
5. **Issue #012**: Authentication state display bug (User experience)
6. **Issue #015**: Settings page 404 error (User management)
7. **Issue #001**: Language toggle logout bug (Critical user experience)
8. **Issue #008**: Subscription buttons 404 errors (Monetization)
9. **Issue #013**: Referral dashboard 404 error (Feature accessibility)

---

## 🔧 **NEXT STEPS**

### **Immediate Actions Required:**
1. **Investigate language toggle logout issue** - Priority 1
2. **Review and update FAQ content** - Priority 2  
3. **Verify pricing calculations and savings percentages** - Priority 3
4. **Update pricing display format for yearly plans** - Priority 4
5. **Reorganize pricing page information architecture** - Priority 5

### **Technical Investigation Needed:**
- Language switcher implementation in header component
- Session management during locale changes
- Pricing calculation logic verification
- FAQ content management system

### **Business Decisions Required:**
- Final refund policy approval
- Token explanation approach (detailed vs simplified)
- Downgrade timing policy confirmation

---

## 📝 **RESOLUTION TRACKING**

### **Issue Resolution Template:**
```markdown
### **RESOLVED: Issue #XXX - [Title]**
- **Resolution Date**: [Date]
- **Resolved By**: [Developer]
- **Solution**: [Brief description]
- **Testing**: [Testing performed]
- **Status**: CLOSED
```

### **Issue #027: Arabic Pricing Page Mixed Languages**
- **Category**: Internationalization & Translation
- **Priority**: HIGH  
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
Arabic pricing page contains mixed Arabic and English text, making it inconsistent and unprofessional.

**Current Issues:**
1. **Token descriptions mixed**: "10K tokens/month", "50K tokens/month", "100K tokens/month", "200K tokens/month", "1M tokens/month" should be in Arabic
2. **Subtitle contains English**: "اختر الخطة المثالية لاحتياجات إنشاء المستنداتwith full Arabic and English support." 
3. **Entire FAQ section in English**: "Frequently Asked Questions", "What are tokens?", "Can I upgrade or downgrade anytime?", "Do you offer refunds?", "Is my data secure?" and all answers
4. **Inconsistent translation**: Some parts properly translated, others remain in English

**Expected Behavior:**
- All text should be in Arabic for Arabic interface
- Token descriptions should use Arabic numerals and text: "10 آلاف رمز/شهر"
- FAQ section should be completely translated
- Consistent Arabic interface throughout

**Impact:**
- Poor user experience for Arabic speakers
- Unprofessional appearance
- Inconsistent localization

---

### **Issue #028: Background Color Inconsistencies Found**
- **Category**: UI/UX - Visual Design  
- **Priority**: MEDIUM
- **Status**: PENDING
- **Reported**: August 21, 2025

**Description:**
After implementing black backgrounds, some pages still contain `bg-gray-50` classes and text readability issues need verification.

**Pages Checked:**
- ✅ Pricing page: Good contrast, white background with dark text works well
- ✅ Contact page: Dark background with good text contrast
- ✅ Feedback page: Good contrast and readability
- ⚠️ Documents page: Returns 404 error, needs investigation
- ⚠️ Need to check remaining pages with authentication

**Technical Notes:**
- Most public pages now have consistent dark backgrounds
- Text contrast appears good on checked pages
- Need to verify authenticated pages (dashboard, settings, documents)

**Impact:**
- Visual consistency achieved for most pages
- Minor verification needed for protected routes

---

---

**Document Control:**
- **Version**: 1.1
- **Created**: August 19, 2025
- **Last Updated**: August 21, 2025
- **Next Review**: August 22, 2025
- **Maintained By**: Development Team