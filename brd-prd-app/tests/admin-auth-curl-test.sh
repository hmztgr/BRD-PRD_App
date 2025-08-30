#!/bin/bash

# Comprehensive Admin Authentication Test using curl
# Tests the complete authentication API flow

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@smartdocs.ai"
ADMIN_PASSWORD="admin123"
COOKIE_JAR="./admin_cookies.txt"
OUTPUT_DIR="./test_output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting comprehensive admin authentication test with curl..."
echo "========================================================"

# Step 1: Test server availability
echo "📍 Step 1: Testing server availability"
SERVER_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL")
echo "✓ Server status: $SERVER_RESPONSE"

if [ "$SERVER_RESPONSE" != "200" ] && [ "$SERVER_RESPONSE" != "307" ] && [ "$SERVER_RESPONSE" != "302" ] && [ "$SERVER_RESPONSE" != "500" ]; then
    echo "❌ Server not available at $BASE_URL"
    exit 1
else
    echo "✅ Server is responding (allowing 500 for debugging)"
fi

# Step 2: Get signin page and extract CSRF token
echo "📍 Step 2: Getting signin page and CSRF token"
SIGNIN_PAGE=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/en/auth/signin")
echo "$SIGNIN_PAGE" > "$OUTPUT_DIR/signin_page.html"

# Try to extract CSRF token (if present)
CSRF_TOKEN=$(echo "$SIGNIN_PAGE" | grep -o 'name="csrfToken"[^>]*value="[^"]*"' | sed 's/.*value="\([^"]*\)".*/\1/' | head -1)
if [ -n "$CSRF_TOKEN" ]; then
    echo "✓ CSRF Token found: ${CSRF_TOKEN:0:20}..."
else
    echo "⚠️  No CSRF token found in signin page"
    CSRF_TOKEN="test"
fi

# Step 3: Test NextAuth configuration
echo "📍 Step 3: Testing NextAuth providers endpoint"
PROVIDERS_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/auth/providers")
PROVIDERS_STATUS=$(echo "$PROVIDERS_RESPONSE" | tail -1)
PROVIDERS_BODY=$(echo "$PROVIDERS_RESPONSE" | head -n -1)
echo "✓ Providers endpoint status: $PROVIDERS_STATUS"
echo "$PROVIDERS_BODY" > "$OUTPUT_DIR/providers.json"

# Step 4: Test CSRF endpoint
echo "📍 Step 4: Testing CSRF endpoint"
CSRF_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
CSRF_STATUS=$(echo "$CSRF_RESPONSE" | tail -1)
CSRF_BODY=$(echo "$CSRF_RESPONSE" | head -n -1)
echo "✓ CSRF endpoint status: $CSRF_STATUS"
echo "$CSRF_BODY" > "$OUTPUT_DIR/csrf.json"

# Extract CSRF token from API response if available
API_CSRF_TOKEN=$(echo "$CSRF_BODY" | grep -o '"csrfToken":"[^"]*"' | sed 's/"csrfToken":"\([^"]*\)"/\1/')
if [ -n "$API_CSRF_TOKEN" ]; then
    echo "✓ API CSRF Token found: ${API_CSRF_TOKEN:0:20}..."
    CSRF_TOKEN="$API_CSRF_TOKEN"
fi

# Step 5: Attempt authentication using credentials provider
echo "📍 Step 5: Testing credentials authentication"
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&csrfToken=$CSRF_TOKEN&callbackUrl=$BASE_URL/en/admin" \
    "$BASE_URL/api/auth/callback/credentials")

AUTH_STATUS=$(echo "$AUTH_RESPONSE" | tail -1)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | head -n -1)
echo "✓ Auth callback status: $AUTH_STATUS"
echo "$AUTH_BODY" > "$OUTPUT_DIR/auth_response.html"

# Check if auth was successful (look for redirect or success indicators)
if echo "$AUTH_BODY" | grep -q "admin" || [ "$AUTH_STATUS" = "302" ]; then
    echo "✅ Authentication appears successful (status: $AUTH_STATUS)"
else
    echo "❌ Authentication may have failed (status: $AUTH_STATUS)"
fi

# Step 6: Test session endpoint
echo "📍 Step 6: Testing session endpoint"
SESSION_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/auth/session")
SESSION_STATUS=$(echo "$SESSION_RESPONSE" | tail -1)
SESSION_BODY=$(echo "$SESSION_RESPONSE" | head -n -1)
echo "✓ Session endpoint status: $SESSION_STATUS"
echo "$SESSION_BODY" > "$OUTPUT_DIR/session.json"

# Parse session data
if echo "$SESSION_BODY" | grep -q "admin@smartdocs.ai"; then
    echo "✅ Session contains admin email"
else
    echo "❌ Session does not contain admin email"
fi

if echo "$SESSION_BODY" | grep -q '"role":"admin"'; then
    echo "✅ Session shows admin role"
else
    echo "❌ Session does not show admin role"
fi

# Step 7: Test debug session endpoint
echo "📍 Step 7: Testing debug session endpoint"
DEBUG_SESSION_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/debug/session")
DEBUG_SESSION_STATUS=$(echo "$DEBUG_SESSION_RESPONSE" | tail -1)
DEBUG_SESSION_BODY=$(echo "$DEBUG_SESSION_RESPONSE" | head -n -1)
echo "✓ Debug session status: $DEBUG_SESSION_STATUS"
echo "$DEBUG_SESSION_BODY" > "$OUTPUT_DIR/debug_session.json"

# Step 8: Test admin panel access
echo "📍 Step 8: Testing admin panel access"
ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -L "$BASE_URL/en/admin")
ADMIN_STATUS=$(echo "$ADMIN_RESPONSE" | tail -1)
ADMIN_BODY=$(echo "$ADMIN_RESPONSE" | head -n -1)
echo "✓ Admin panel status: $ADMIN_STATUS"
echo "$ADMIN_BODY" > "$OUTPUT_DIR/admin_panel.html"

# Check if redirected to admin-access-required
if echo "$ADMIN_BODY" | grep -q "admin-access-required\|Access denied\|Unauthorized"; then
    echo "❌ ISSUE: Admin access denied or redirected to error page"
else
    echo "✅ Admin panel appears accessible"
fi

# Step 9: Test specific admin API endpoints
echo "📍 Step 9: Testing admin API endpoints"

ADMIN_ENDPOINTS=(
    "/api/admin/analytics/users"
    "/api/admin/activity" 
    "/api/admin/setup-stripe"
)

for endpoint in "${ADMIN_ENDPOINTS[@]}"; do
    echo "  Testing: $endpoint"
    ENDPOINT_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL$endpoint")
    ENDPOINT_STATUS=$(echo "$ENDPOINT_RESPONSE" | tail -1)
    ENDPOINT_BODY=$(echo "$ENDPOINT_RESPONSE" | head -n -1)
    
    echo "    Status: $ENDPOINT_STATUS"
    
    # Save response
    FILENAME=$(echo "$endpoint" | sed 's/\//_/g' | sed 's/^_//')
    echo "$ENDPOINT_BODY" > "$OUTPUT_DIR/${FILENAME}.json"
    
    if [ "$ENDPOINT_STATUS" = "200" ]; then
        echo "    ✅ Success"
    elif [ "$ENDPOINT_STATUS" = "401" ] || [ "$ENDPOINT_STATUS" = "403" ]; then
        echo "    ❌ Access denied"
    else
        echo "    ⚠️  Unexpected status"
    fi
done

# Step 10: Test database admin creation
echo "📍 Step 10: Testing admin user creation endpoint"
CREATE_ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/debug/create-admin")
CREATE_ADMIN_STATUS=$(echo "$CREATE_ADMIN_RESPONSE" | tail -1)
CREATE_ADMIN_BODY=$(echo "$CREATE_ADMIN_RESPONSE" | head -n -1)
echo "✓ Create admin status: $CREATE_ADMIN_STATUS"
echo "$CREATE_ADMIN_BODY" > "$OUTPUT_DIR/create_admin.json"

# Step 11: Analyze cookies
echo "📍 Step 11: Analyzing cookies"
if [ -f "$COOKIE_JAR" ]; then
    echo "🍪 Cookies saved:"
    cat "$COOKIE_JAR" | grep -v "^#" | while read line; do
        if [ -n "$line" ]; then
            COOKIE_NAME=$(echo "$line" | cut -f6)
            COOKIE_VALUE=$(echo "$line" | cut -f7)
            echo "  - $COOKIE_NAME: ${COOKIE_VALUE:0:30}..."
        fi
    done
else
    echo "⚠️  No cookies saved"
fi

# Step 12: Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo "Server Status: $SERVER_RESPONSE"
echo "Auth Status: $AUTH_STATUS"
echo "Session Status: $SESSION_STATUS"
echo "Admin Panel Status: $ADMIN_STATUS"
echo ""
echo "📁 Test outputs saved in: $OUTPUT_DIR"
echo "🍪 Cookies saved in: $COOKIE_JAR"
echo ""
echo "🏁 Admin authentication test completed"

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f "$COOKIE_JAR"
echo "✓ Cleanup complete"