# Multi-stage build for Swagger UI with security hardening
# Looking for information on environment variables?
# Check our documentation: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md

# Stage 1: Build environment
FROM node:20.18-alpine AS builder

# Security: Update packages and install build dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    git \
    && rm -rf /var/cache/apk/*

# Create non-root user for build
RUN addgroup -g 1001 -S swaggerui && \
    adduser -S swaggerui -u 1001 -G swaggerui

WORKDIR /app

# Copy package files for dependency installation
COPY --chown=swaggerui:swaggerui package*.json ./

# Install dependencies as non-root user
USER swaggerui
RUN npm ci --only=production && npm cache clean --force

# Copy source and build
COPY --chown=swaggerui:swaggerui . .
RUN npm run build

# Stage 2: Security-hardened runtime
FROM nginxinc/nginx-unprivileged:1.26-alpine AS runtime

# Security labels and metadata
LABEL maintainer="swagger-ui-maintainers" \
      org.opencontainers.image.authors="swagger-ui-maintainers" \
      org.opencontainers.image.url="docker.swagger.io/swaggerapi/swagger-ui" \
      org.opencontainers.image.source="https://github.com/swagger-api/swagger-ui" \
      org.opencontainers.image.description="Security-hardened SwaggerUI Docker image" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.version="${VERSION:-latest}" \
      security.scan.enabled="true"

# Security: Update packages and install only necessary runtime dependencies
USER root
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    "nodejs>=20" \
    "libxml2>=2.13.4-r6" \
    "libexpat>=2.7.0-r0" \
    "libxslt>=1.1.42-r2" \
    "xz-libs>=5.6.3-r1" \
    "c-ares>=1.34.5-r0" \
    curl \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Environment variables with security considerations
ENV API_KEY="" \
    SWAGGER_JSON="/app/swagger.json" \
    PORT="8080" \
    PORT_IPV6="" \
    BASE_URL="/" \
    SWAGGER_JSON_URL="" \
    CORS="true" \
    EMBEDDING="false" \
    NGINX_WORKER_PROCESSES="auto" \
    NGINX_WORKER_CONNECTIONS="1024"

# Copy configuration files with proper permissions
COPY --chown=nginx:nginx --chmod=0644 ./docker/default.conf.template ./docker/cors.conf ./docker/embedding.conf /etc/nginx/templates/

# Copy built application from builder stage
COPY --from=builder --chown=nginx:nginx --chmod=0644 /app/dist/* /usr/share/nginx/html/

# Copy Docker entrypoint and configurator
COPY --chown=nginx:nginx --chmod=0755 ./docker/docker-entrypoint.d/ /docker-entrypoint.d/
COPY --chown=nginx:nginx --chmod=0644 ./docker/configurator /usr/share/nginx/configurator

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && chmod -R 755 /var/cache/nginx /var/log/nginx \
    && chmod 755 /etc/nginx/templates /usr/share/nginx/configurator

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080${BASE_URL} || exit 1

# Security: Switch to non-root user for runtime
USER nginx

# Expose port (non-privileged port for security)
EXPOSE 8080

# Default command with proper signal handling
CMD ["nginx", "-g", "daemon off;"]