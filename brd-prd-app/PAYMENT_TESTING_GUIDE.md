# 💳 Payment Testing Guide

## 🔧 Setup Status

✅ **Stripe Test Keys Configured**
- Public Key: `pk_test_51RyXVU...` 
- Secret Key: `sk_test_51RyXVU...`
- Webhook Secret: `whsec_SCCfr1ql...`

✅ **Stripe Products Created**
- Professional Plan (Monthly: $3.80, Yearly: $34.20)
- Business Plan (Monthly: $9.80, Yearly: $88.20)  
- Enterprise Plan (Monthly: $39.80, Yearly: $358.20)

## 🧪 Test Cards for Payment Testing

### ✅ Successful Payments
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any valid postal code (e.g., 12345)
```

### ❌ Failed Payments (for testing error handling)
```
Declined Card: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired Card: 4000 0000 0000 0069
Incorrect CVC: 4000 0000 0000 0127
Processing Error: 4000 0000 0000 0119
```

### 🔄 Authentication Required (3D Secure)
```
Authentication Required: 4000 0025 0000 3155
```

## 🚀 How to Test Payments

### 1. **Access the Pricing Page**
```
URL: http://localhost:3005/en/pricing
```

### 2. **Test Subscription Flow**
1. Click "Start Free Trial" or "Subscribe" on any plan
2. Fill in test card details (use 4242 4242 4242 4242)
3. Complete checkout process
4. Verify redirection to success page
5. Check subscription status in dashboard

### 3. **Test Different Scenarios**

#### ✅ **Successful Payment**
- Use card: `4242 4242 4242 4242`
- Should redirect to dashboard with subscription active
- Check user's subscription tier updated

#### ❌ **Failed Payment**
- Use card: `4000 0000 0000 0002` (declined)
- Should show error message
- User should remain on current plan

#### 🔐 **3D Secure Authentication**
- Use card: `4000 0025 0000 3155`
- Complete 3D Secure challenge
- Should succeed after authentication

## 🎯 Test Checklist

### Basic Payment Flow
- [ ] Can access pricing page
- [ ] Subscription buttons work (no 404 errors)
- [ ] Checkout session creates successfully  
- [ ] Test card payment processes
- [ ] Success page displays correctly
- [ ] User subscription tier updates
- [ ] Dashboard shows correct plan

### Error Handling
- [ ] Declined card shows appropriate error
- [ ] Network errors handled gracefully
- [ ] Invalid card details rejected
- [ ] Expired cards handled properly

### Webhook Testing
- [ ] Subscription created webhook received
- [ ] Payment succeeded webhook processed
- [ ] Subscription updated webhook handled
- [ ] Failed payment webhook processed

## 🔍 Debugging Payment Issues

### 1. **Check Browser Console**
Look for JavaScript errors during checkout:
```javascript
// Common errors to watch for:
Failed to create checkout session
Stripe publishable key not found
Payment element failed to mount
```

### 2. **Check Network Tab**
Verify API calls are successful:
```
POST /api/subscription/create-checkout → 200 OK
POST /api/webhooks/stripe → 200 OK
```

### 3. **Check Server Logs**
Look for Stripe-related errors in terminal:
```bash
# In the terminal running npm run dev
Error creating checkout session: [details]
Webhook verification failed: [details]
Subscription update error: [details]
```

### 4. **Stripe Dashboard**
Monitor test data in Stripe Dashboard:
- Go to [Stripe Test Dashboard](https://dashboard.stripe.com/test)
- Check Payments, Customers, Subscriptions sections
- Verify webhook endpoints are receiving events

## 🔧 Webhook Testing

### Local Webhook URL
```
http://localhost:3005/api/webhooks/stripe
```

### Stripe CLI (Optional)
Install Stripe CLI for advanced webhook testing:
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3005/api/webhooks/stripe
```

## 🎭 User Flow Testing

### Complete User Journey
1. **Sign Up** → Create account
2. **Browse Pricing** → View available plans  
3. **Select Plan** → Choose subscription tier
4. **Payment** → Complete checkout process
5. **Verification** → Confirm subscription active
6. **Usage** → Test features with new plan
7. **Management** → Access billing portal

### Test User Scenarios
- New user with no payment history
- Existing user upgrading plan
- User with failed payment history
- User downgrading subscription

## ⚡ Quick Test Commands

### Setup Stripe Products (if needed)
```bash
curl -X POST http://localhost:3005/api/admin/setup-stripe
```

### Test API Endpoints
```bash
# Test subscription creation
curl -X POST http://localhost:3005/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test_123","returnUrl":"http://localhost:3005"}'

# Test webhook endpoint
curl -X POST http://localhost:3005/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{"type":"payment_intent.succeeded"}'
```

## 🚨 Current Known Issues

### ✅ Fixed Issues
- ✅ Referral page 404 (fixed - corrected navigation)
- ✅ Settings navigation inconsistency (fixed)
- ✅ Contact form dropdown transparency (fixed)

### ⚠️ Remaining Issues to Test
- ⚠️ Checkout session creation failure (Error in handleSubscribe function)
- ⚠️ Authentication state not updating after successful login
- ⚠️ Pricing page showing "Start Free Trial" for existing users

## 📞 Support & Resources

### Stripe Documentation
- [Test Cards](https://stripe.com/docs/testing#cards)
- [Webhooks Testing](https://stripe.com/docs/webhooks/test)
- [Checkout Sessions](https://stripe.com/docs/payments/checkout)

### Application Specific
- Check `/src/lib/stripe.ts` for configuration
- Review `/src/app/api/subscription/` for API endpoints
- Monitor `/src/app/api/webhooks/stripe/` for webhook handling

---

**Last Updated:** August 21, 2025  
**Test Environment:** Development (localhost:3005)  
**Stripe Mode:** Test Mode