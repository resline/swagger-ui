#!/bin/bash

# Secure Filebeat Deployment Script
# This script deploys the security-hardened Filebeat configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔒 Deploying Secure Filebeat Configuration"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in project root"
    exit 1
fi

# Build the custom Filebeat image
echo "🔨 Building secure Filebeat image..."
cd "$PROJECT_ROOT"
docker-compose build filebeat

if [ $? -eq 0 ]; then
    echo "✅ Filebeat image built successfully"
else
    echo "❌ Failed to build Filebeat image"
    exit 1
fi

# Stop existing services if running
echo "🛑 Stopping existing logging services..."
docker-compose stop filebeat docker-socket-proxy 2>/dev/null || true
docker-compose rm -f filebeat docker-socket-proxy 2>/dev/null || true

# Start the secure configuration
echo "🚀 Starting secure logging stack..."
docker-compose up -d docker-socket-proxy
sleep 5  # Wait for socket proxy to be ready
docker-compose up -d filebeat

# Verify deployment
echo "🔍 Verifying secure deployment..."

# Check that socket proxy is running
if docker-compose ps docker-socket-proxy | grep -q "Up"; then
    echo "✅ Docker Socket Proxy is running"
else
    echo "❌ Docker Socket Proxy failed to start"
    exit 1
fi

# Check that Filebeat is running as non-root
if docker-compose ps filebeat | grep -q "Up"; then
    echo "✅ Filebeat is running"
    
    # Verify user
    USER_CHECK=$(docker-compose exec -T filebeat whoami 2>/dev/null || echo "failed")
    if [ "$USER_CHECK" = "filebeat" ]; then
        echo "✅ Filebeat is running as non-root user"
    else
        echo "❌ Warning: Could not verify Filebeat user"
    fi
else
    echo "❌ Filebeat failed to start"
    exit 1
fi

# Test connectivity
echo "🧪 Testing log collection..."
sleep 10  # Allow time for initialization

# Check Filebeat logs for successful startup
if docker-compose logs filebeat 2>/dev/null | grep -q "Filebeat is running"; then
    echo "✅ Filebeat initialized successfully"
elif docker-compose logs filebeat 2>/dev/null | grep -q "Connection to backoff"; then
    echo "✅ Filebeat is attempting connections (normal during startup)"
else
    echo "⚠️  Filebeat status unclear - check logs manually"
fi

echo ""
echo "🎉 Security-hardened Filebeat deployment completed!"
echo ""
echo "Security Improvements:"
echo "  • Filebeat no longer runs as root"
echo "  • Docker socket access via secure proxy"
echo "  • Read-only filesystems enabled"
echo "  • No privilege escalation allowed"
echo "  • Health monitoring enabled"
echo ""
echo "Next steps:"
echo "  1. Monitor logs: docker-compose logs -f filebeat"
echo "  2. Check Elasticsearch: curl http://localhost:9200/_cat/indices"
echo "  3. Verify in Kibana: http://localhost:5601"
echo ""
echo "For troubleshooting, see: $PROJECT_ROOT/monitoring/SECURITY.md"