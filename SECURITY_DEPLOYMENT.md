# Security-Hardened Swagger UI Deployment Guide

This repository contains a security-hardened Docker implementation of Swagger UI with comprehensive monitoring, logging, and DevOps best practices.

## 🛡️ Security Features

### Container Security
- **Non-root user execution**: Runs as unprivileged `nginx` user
- **Multi-stage builds**: Minimized attack surface with separate build/runtime stages
- **Read-only root filesystem**: Prevents runtime modifications
- **Security headers**: HSTS, CSP, X-Frame-Options, etc.
- **Resource limits**: CPU and memory constraints
- **Health checks**: Built-in container health monitoring

### Network Security
- **Rate limiting**: Configurable limits for different endpoints
- **CORS configuration**: Secure cross-origin resource sharing
- **SSL/TLS support**: HTTPS with custom certificates
- **Network isolation**: Docker network segmentation

### Secrets Management
- **Docker secrets**: Secure secret injection
- **Environment validation**: Configuration verification
- **Secret rotation**: Automated secret management
- **No hardcoded credentials**: All secrets externalized

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Validate configuration
./scripts/validate-env.sh

# Generate secrets
./scripts/manage-secrets.sh generate-all
```

### 2. Development Deployment
```bash
# Start basic development environment
make dev-setup

# Or use docker-compose directly
docker-compose up -d swagger-ui
```

### 3. Production Deployment
```bash
# Build and deploy with full monitoring stack
make deploy-production

# Or with secrets management
docker-compose -f docker-compose.yml -f docker-compose.secrets.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring Stack

The deployment includes a comprehensive monitoring solution:

### Services
- **Swagger UI**: Main application on port 8080
- **Prometheus**: Metrics collection on port 9090
- **Grafana**: Visualization dashboard on port 3000
- **Elasticsearch**: Log aggregation on port 9200
- **Kibana**: Log visualization on port 5601
- **Filebeat**: Log shipping
- **Nginx Exporter**: Web server metrics

### Access URLs
After deployment, access these services:

- **Swagger UI**: http://localhost:8080
- **Grafana Dashboard**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

### Monitoring Features
- Real-time performance metrics
- Request/response analytics
- Error tracking and alerting
- Resource utilization monitoring
- Security event logging

## 🔐 Security Configuration

### SSL/TLS Setup
```bash
# Generate self-signed certificate
./scripts/manage-secrets.sh generate-ssl your-domain.com

# Use with production deployment
docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up -d
```

### Environment Variables Security
Critical security settings in `.env`:

```bash
# Security
FORCE_HTTPS=true
RUN_AS_NON_ROOT=true
READ_ONLY_ROOT_FILESYSTEM=true
NO_NEW_PRIVILEGES=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_SECOND=30

# Change default passwords!
GRAFANA_PASSWORD=your-secure-password
```

### Secrets Management
```bash
# Generate all required secrets
./scripts/manage-secrets.sh generate-all

# Validate secrets configuration
./scripts/manage-secrets.sh validate

# Rotate secrets periodically
./scripts/manage-secrets.sh rotate

# Check secrets status
./scripts/manage-secrets.sh status
```

## 🔄 CI/CD Pipeline

The repository includes a comprehensive GitHub Actions workflow:

### Security Scanning
- **Dockerfile linting** with Hadolint
- **Vulnerability scanning** with Trivy
- **Secret detection** with TruffleHog
- **SBOM generation** with Syft
- **Image signing** with Cosign

### Testing
- **Container security tests**
- **Health check validation**
- **Performance testing** with Artillery
- **Load testing**

### Deployment
- **Staging deployment** on develop branch
- **Production deployment** on main branch
- **Multi-platform builds** (AMD64/ARM64)

## 🛠️ Build System

### Make Commands
```bash
# Install security tools
make install-tools

# Build with security scanning
make build

# Run comprehensive security scan
make security-scan

# Generate vulnerability reports
make vulnerability-report

# Test the built image
make test

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-production

# Show monitoring URLs
make monitor

# Clean up resources
make clean
```

### Docker Commands
```bash
# Build image
docker build -t swagger-ui:latest .

# Run security scan
trivy image swagger-ui:latest

# Run container with security options
docker run -d --name swagger-ui \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  --tmpfs /var/cache/nginx \
  --security-opt no-new-privileges:true \
  -p 8080:8080 \
  swagger-ui:latest
```

## 📝 Configuration Reference

### Core Application Settings
- `SWAGGER_UI_PORT`: Application port (default: 8080)
- `API_KEY`: API authentication key
- `SWAGGER_JSON_URL`: OpenAPI specification URL
- `BASE_URL`: Application base path
- `CORS`: Enable CORS (default: true)

### Security Settings
- `FORCE_HTTPS`: Enforce HTTPS redirects
- `RUN_AS_NON_ROOT`: Run as non-privileged user
- `READ_ONLY_ROOT_FILESYSTEM`: Read-only container filesystem
- `NO_NEW_PRIVILEGES`: Prevent privilege escalation

### Rate Limiting
- `RATE_LIMIT_ENABLED`: Enable rate limiting
- `RATE_LIMIT_REQUESTS_PER_SECOND`: General rate limit
- `API_RATE_LIMIT_REQUESTS_PER_SECOND`: API endpoint limit
- `AUTH_RATE_LIMIT_REQUESTS_PER_SECOND`: Authentication endpoint limit

### Monitoring
- `PROMETHEUS_PORT`: Prometheus metrics port
- `GRAFANA_PORT`: Grafana dashboard port
- `GRAFANA_USER`/`GRAFANA_PASSWORD`: Dashboard credentials

## 🔍 Security Best Practices

### Container Security
1. **Always run as non-root user**
2. **Use read-only filesystem**
3. **Implement proper health checks**
4. **Set resource limits**
5. **Use multi-stage builds**
6. **Scan images for vulnerabilities**

### Network Security
1. **Enable HTTPS in production**
2. **Implement rate limiting**
3. **Use network segmentation**
4. **Configure proper CORS headers**

### Secrets Management
1. **Never hardcode secrets**
2. **Use Docker secrets or external secret management**
3. **Rotate secrets regularly**
4. **Validate configuration**

### Monitoring and Logging
1. **Enable comprehensive logging**
2. **Monitor security events**
3. **Set up alerting**
4. **Regular security audits**

## 🆘 Troubleshooting

### Common Issues

#### Container Permission Errors
```bash
# Check container user
docker exec swagger-ui id

# Verify file permissions
docker exec swagger-ui ls -la /usr/share/nginx/html
```

#### Health Check Failures
```bash
# Test health endpoint
curl -f http://localhost:8080/health

# Check container logs
docker logs swagger-ui
```

#### Monitoring Stack Issues
```bash
# Check all services
docker-compose ps

# View service logs
docker-compose logs grafana
```

### Performance Tuning
```bash
# Adjust worker processes
export NGINX_WORKER_PROCESSES=4
export NGINX_WORKER_CONNECTIONS=2048

# Monitor resource usage
docker stats swagger-ui
```

## 📚 Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Container Security](https://owasp.org/www-project-container-security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## 🤝 Contributing

1. Run security scans before submitting PRs
2. Update documentation for configuration changes
3. Test with both development and production configurations
4. Follow security best practices

## 📄 License

This implementation maintains the original Apache-2.0 license from Swagger UI.

---

**Security Notice**: This implementation includes security hardening measures, but you should always review and adapt the configuration for your specific security requirements and threat model.