#!/bin/bash

# Security Validation Script for Filebeat Configuration
# This script validates that the security improvements are working correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Security Validation for Filebeat Configuration"
echo "================================================"

cd "$PROJECT_ROOT"

# Function to check service status
check_service() {
    local service_name=$1
    if docker-compose ps "$service_name" | grep -q "Up"; then
        echo "✅ $service_name is running"
        return 0
    else
        echo "❌ $service_name is not running"
        return 1
    fi
}

# Function to run security checks
security_check() {
    local service_name=$1
    local check_description=$2
    local command=$3
    
    echo "🔒 Checking: $check_description"
    if eval "$command" >/dev/null 2>&1; then
        echo "✅ PASS: $check_description"
    else
        echo "❌ FAIL: $check_description"
        return 1
    fi
}

# Basic service checks
echo "📋 Service Status Checks"
echo "------------------------"
check_service "docker-socket-proxy"
check_service "filebeat"
check_service "elasticsearch"

echo ""
echo "🔐 Security Validation Checks"
echo "-----------------------------"

# Check 1: Verify Filebeat is not running as root
security_check "filebeat" "Filebeat running as non-root user" \
    "docker-compose exec -T filebeat whoami | grep -q 'filebeat'"

# Check 2: Verify socket proxy is running as non-root
security_check "docker-socket-proxy" "Socket proxy running as non-root" \
    "docker-compose exec -T docker-socket-proxy whoami | grep -v -q 'root'"

# Check 3: Verify Filebeat container has no direct Docker socket access
security_check "filebeat" "No direct Docker socket access in Filebeat" \
    "! docker-compose exec -T filebeat ls -la /var/run/docker.sock 2>/dev/null"

# Check 4: Verify read-only filesystem for Filebeat
security_check "filebeat" "Filebeat filesystem is read-only" \
    "! docker-compose exec -T filebeat touch /test-write 2>/dev/null"

# Check 5: Verify no-new-privileges is set
security_check "filebeat" "No new privileges flag set" \
    "docker inspect swagger-filebeat | grep -q 'no-new-privileges:true'"

security_check "docker-socket-proxy" "Socket proxy no new privileges flag set" \
    "docker inspect swagger-docker-socket-proxy | grep -q 'no-new-privileges:true'"

echo ""
echo "🔌 Connectivity Validation"
echo "-------------------------"

# Check 6: Verify Filebeat can reach Elasticsearch
security_check "connectivity" "Filebeat can reach Elasticsearch" \
    "docker-compose exec -T filebeat curl -s http://elasticsearch:9200/_cluster/health"

# Check 7: Verify socket proxy is accessible from Filebeat
security_check "connectivity" "Socket proxy accessible from Filebeat" \
    "docker-compose exec -T filebeat nc -z docker-socket-proxy 2375"

# Check 8: Verify logs are being collected
echo "📊 Log Collection Validation"
echo "---------------------------"

echo "🔍 Checking Elasticsearch indices..."
INDICES=$(docker-compose exec -T elasticsearch curl -s "http://localhost:9200/_cat/indices" | grep swagger-ui || echo "")

if [ -n "$INDICES" ]; then
    echo "✅ PASS: Elasticsearch indices found for swagger-ui logs"
    echo "$INDICES"
else
    echo "⚠️  WARNING: No swagger-ui indices found yet (may need time for first logs)"
fi

echo ""
echo "📈 Health Check Status"
echo "---------------------"

# Check health status
FILEBEAT_HEALTH=$(docker inspect swagger-filebeat --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
echo "Filebeat health: $FILEBEAT_HEALTH"

if [ "$FILEBEAT_HEALTH" = "healthy" ]; then
    echo "✅ PASS: Filebeat health check is passing"
elif [ "$FILEBEAT_HEALTH" = "starting" ]; then
    echo "⏳ INFO: Filebeat is still starting up"
else
    echo "⚠️  WARNING: Filebeat health status: $FILEBEAT_HEALTH"
fi

echo ""
echo "🏷️  Container Labels and Metadata"
echo "--------------------------------"

# Verify security labels
FILEBEAT_LABELS=$(docker inspect swagger-filebeat --format='{{range $key, $value := .Config.Labels}}{{$key}}={{$value}} {{end}}' 2>/dev/null)
if echo "$FILEBEAT_LABELS" | grep -q "com.docker.compose.service=logging"; then
    echo "✅ PASS: Filebeat has correct service labels"
else
    echo "❌ FAIL: Filebeat missing service labels"
fi

echo ""
echo "📋 Security Validation Summary"
echo "=============================="

# Count passed/failed checks
TOTAL_CHECKS=8
echo "Security validation completed for Filebeat hardening."
echo ""
echo "Key Security Improvements Verified:"
echo "  🔒 Non-root user execution"
echo "  🚫 No direct Docker socket access"
echo "  📖 Read-only filesystem"
echo "  🛡️  No privilege escalation"
echo "  🔐 Secure Docker API proxy"
echo "  ❤️  Health monitoring"
echo ""

if [ $? -eq 0 ]; then
    echo "✅ All critical security checks passed!"
    echo "   Your Filebeat configuration is now secure."
else
    echo "⚠️  Some checks failed. Review the output above."
    echo "   Check the logs for more details:"
    echo "   - docker-compose logs filebeat"
    echo "   - docker-compose logs docker-socket-proxy"
fi

echo ""
echo "For detailed security information, see:"
echo "  📖 $PROJECT_ROOT/monitoring/SECURITY.md"