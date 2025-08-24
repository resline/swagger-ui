# Docker Socket Proxy for secure Docker API access
# This container provides a secure proxy to the Docker socket with minimal permissions
FROM tecnativa/docker-socket-proxy:0.1.1

# Security labels and metadata
LABEL maintainer="swagger-ui-maintainers" \
      org.opencontainers.image.description="Secure Docker Socket Proxy for Filebeat" \
      org.opencontainers.image.licenses="Apache-2.0" \
      security.scan.enabled="true"

# Security: Run as non-root user
USER 1001:1001