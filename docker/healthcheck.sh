#!/bin/sh
# Health check script for Swagger UI container

set -e

# Health check endpoint
HEALTH_URL="http://localhost:${PORT:-8080}${BASE_URL:-/}"

# Perform health check
curl -f "${HEALTH_URL}" > /dev/null 2>&1 || {
    echo "Health check failed for ${HEALTH_URL}"
    exit 1
}

echo "Health check passed for ${HEALTH_URL}"
exit 0