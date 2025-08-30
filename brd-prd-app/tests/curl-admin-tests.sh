#!/bin/bash

# Comprehensive Admin Authentication Test Suite using curl
# Tests all aspects of admin login, session management, and security

set -e

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@smartdocs.ai"
ADMIN_PASSWORD="admin123"
COOKIE_JAR="/tmp/admin_test_cookies.txt"
TEST_RESULTS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

log() {
    local type=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $type in
        "SUCCESS")
            echo -e "${GREEN}[$timestamp] SUCCESS: $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$timestamp] WARNING: $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}[$timestamp] INFO: $message${NC}"
            ;;
    esac
    
    TEST_RESULTS+=("[$timestamp] $type: $message")
}

test_result() {
    local name=$1
    local expected=$2
    local actual=$3
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$actual" == "$expected" ]; then
        log "SUCCESS" "$name (Expected: $expected, Got: $actual)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log "ERROR" "$name (Expected: $expected, Got: $actual)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

cleanup() {
    log "INFO" "Cleaning up test files..."
    rm -f "$COOKIE_JAR"
}

# Trap to cleanup on exit
trap cleanup EXIT

test_server_availability() {
    log "INFO" "Testing server availability..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/debug/session" || echo "000")
    
    if [ "$response" == "200" ]; then
        log "SUCCESS" "Server is running and responsive"
        return 0
    else
        log "ERROR" "Server not available (HTTP $response). Please start with: npm run dev"
        return 1
    fi
}

test_debug_endpoint() {
    log "INFO" "Testing debug session endpoint..."
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/debug/session")
    local http_code=$(echo "$response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    test_result "Debug endpoint accessibility" "200" "$http_code"
    
    if [ "$http_code" == "200" ]; then
        log "INFO" "Session data: $body"
    fi
}

test_admin_login_form() {
    log "INFO" "Testing admin login form access..."
    
    # First get the sign-in page
    local response=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" "$BASE_URL/en/auth/signin")
    
    test_result "Sign-in page access" "200" "$response"
}

test_admin_authentication() {
    log "INFO" "Testing admin authentication with NextAuth..."
    
    # Get CSRF token first
    local csrf_response=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
    local csrf_token=$(echo "$csrf_response" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$csrf_token" ]; then
        log "WARNING" "Could not extract CSRF token, proceeding without it"
        csrf_token="test-token"
    else
        log "INFO" "CSRF token obtained: ${csrf_token:0:20}..."
    fi
    
    # Attempt login using credentials provider
    local login_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "csrfToken=$csrf_token&email=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&callbackUrl=$BASE_URL/en/admin&json=true" \
        "$BASE_URL/api/auth/callback/credentials")
    
    local http_code=$(echo "$login_response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$login_response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    log "INFO" "Login response code: $http_code"
    log "INFO" "Login response body: $body"
    
    # Check for successful login (200 or redirect 302)
    if [ "$http_code" == "200" ] || [ "$http_code" == "302" ]; then
        log "SUCCESS" "Authentication request processed"
        return 0
    else
        log "ERROR" "Authentication failed with status $http_code"
        return 1
    fi
}

test_session_validation() {
    log "INFO" "Testing session validation after login..."
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        "$BASE_URL/api/debug/session")
    
    local http_code=$(echo "$response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    test_result "Session endpoint after login" "200" "$http_code"
    
    if [ "$http_code" == "200" ]; then
        # Check if session indicates admin user
        if echo "$body" | grep -q '"hasSession":true'; then
            log "SUCCESS" "Active session detected"
        else
            log "WARNING" "No active session found"
        fi
        
        if echo "$body" | grep -q '"role":"admin"'; then
            log "SUCCESS" "Admin role detected in session"
        elif echo "$body" | grep -q '"role":"super_admin"'; then
            log "SUCCESS" "Super admin role detected in session"
        else
            log "WARNING" "Admin role not found in session"
        fi
    fi
}

test_admin_panel_access() {
    log "INFO" "Testing admin panel access..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -b "$COOKIE_JAR" \
        -L \
        "$BASE_URL/en/admin")
    
    if [ "$response" == "200" ]; then
        log "SUCCESS" "Admin panel accessible with valid session"
    else
        log "WARNING" "Admin panel returned HTTP $response (may be redirecting)"
    fi
}

test_admin_api_endpoints() {
    log "INFO" "Testing admin API endpoints..."
    
    local endpoints=(
        "/api/admin/analytics/users"
        "/api/admin/analytics/system"
        "/api/admin/activity"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" \
            -b "$COOKIE_JAR" \
            "$BASE_URL$endpoint")
        
        if [ "$response" == "200" ]; then
            log "SUCCESS" "Admin API $endpoint accessible"
        elif [ "$response" == "401" ]; then
            log "ERROR" "Admin API $endpoint requires authentication (401)"
        elif [ "$response" == "403" ]; then
            log "ERROR" "Admin API $endpoint forbidden (403)"
        else
            log "WARNING" "Admin API $endpoint returned $response"
        fi
    done
}

test_unauthorized_access() {
    log "INFO" "Testing unauthorized access protection..."
    
    # Test without cookies
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL/en/admin")
    
    if [ "$response" == "302" ] || [ "$response" == "307" ]; then
        log "SUCCESS" "Unauthorized users properly redirected from admin panel"
    else
        log "WARNING" "Admin panel may not be properly protected (HTTP $response)"
    fi
    
    # Test admin API without cookies
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL/api/admin/analytics/users")
    
    if [ "$api_response" == "401" ] || [ "$api_response" == "403" ]; then
        log "SUCCESS" "Admin API properly protected from unauthorized access"
    else
        log "WARNING" "Admin API may not be properly secured (HTTP $api_response)"
    fi
}

test_middleware_security() {
    log "INFO" "Testing middleware security headers..."
    
    local response=$(curl -s -I -b "$COOKIE_JAR" "$BASE_URL/api/admin/analytics/system" | head -n 20)
    
    if echo "$response" | grep -q "HTTP/1.1 200\|HTTP/2 200"; then
        log "SUCCESS" "Admin API accessible with valid session"
    else
        log "WARNING" "Admin API may have issues with authenticated access"
    fi
    
    # Check for security headers (optional)
    if echo "$response" | grep -qi "x-frame-options\|content-security-policy"; then
        log "SUCCESS" "Security headers present"
    else
        log "INFO" "No specific security headers detected (may be handled by Next.js)"
    fi
}

generate_report() {
    log "INFO" "Generating test report..."
    
    local report_file="admin-auth-curl-report.txt"
    
    {
        echo "========================================"
        echo "ADMIN AUTHENTICATION CURL TEST REPORT"
        echo "========================================"
        echo "Test Date: $(date)"
        echo "Base URL: $BASE_URL"
        echo "Admin Email: $ADMIN_EMAIL"
        echo ""
        echo "TEST SUMMARY:"
        echo "============"
        echo "Total Tests: $TESTS_TOTAL"
        echo "Passed: $TESTS_PASSED"
        echo "Failed: $TESTS_FAILED"
        echo "Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
        echo ""
        echo "DETAILED RESULTS:"
        echo "================"
        printf '%s\n' "${TEST_RESULTS[@]}"
        echo ""
        echo "========================================"
    } > "$report_file"
    
    log "SUCCESS" "Report generated: $report_file"
}

print_summary() {
    echo ""
    echo "========================================"
    echo "ADMIN AUTHENTICATION TEST SUMMARY"
    echo "========================================"
    echo -e "${BLUE}Total Tests: $TESTS_TOTAL${NC}"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✅${NC}"
    else
        echo -e "${YELLOW}Some tests failed. Check the detailed output above. ⚠️${NC}"
    fi
    echo "========================================"
}

main() {
    log "INFO" "Starting comprehensive admin authentication tests..."
    echo ""
    
    # Initialize cookie jar
    rm -f "$COOKIE_JAR"
    
    # Run all tests
    test_server_availability || exit 1
    test_debug_endpoint
    test_admin_login_form
    test_admin_authentication
    test_session_validation
    test_admin_panel_access
    test_admin_api_endpoints
    test_unauthorized_access
    test_middleware_security
    
    # Generate report and summary
    generate_report
    print_summary
}

# Run main function
main "$@"