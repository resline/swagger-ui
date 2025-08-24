# Custom Filebeat image with security hardening
FROM docker.elastic.co/beats/filebeat:8.8.2

# Security labels and metadata
LABEL maintainer="swagger-ui-maintainers" \
      org.opencontainers.image.description="Security-hardened Filebeat for log shipping" \
      org.opencontainers.image.licenses="Apache-2.0" \
      security.scan.enabled="true"

# Switch to root temporarily to make changes
USER root

# Create a non-root user for Filebeat
RUN groupadd -r filebeat --gid=1000 && \
    useradd -r -g filebeat --uid=1000 --home-dir=/usr/share/filebeat --shell=/sbin/nologin filebeat

# Create necessary directories and set permissions
RUN mkdir -p /var/log/filebeat /usr/share/filebeat/data && \
    chown -R filebeat:filebeat /usr/share/filebeat /var/log/filebeat && \
    chmod -R 755 /usr/share/filebeat /var/log/filebeat

# Set proper permissions for configuration files
RUN chown -R filebeat:filebeat /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml

# Security: Switch to non-root user for runtime
USER filebeat

# Expose monitoring port (if needed for health checks)
EXPOSE 5066

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD filebeat test output -c /usr/share/filebeat/filebeat.yml || exit 1