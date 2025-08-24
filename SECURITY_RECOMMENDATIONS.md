# 🔒 Security Implementation Guide for Swagger UI

## Quick Security Fixes (Immediate Implementation)

### 1. Add Security Headers (nginx.conf)

```nginx
# File: docker/nginx.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Enhanced CSP
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://api.apis.guru https://*.swagger.io;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    " always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        try_files $uri /index.html;
    }
}
```

### 2. Remove Console Logs from Production

```javascript
// webpack.config.js - Add to production config
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
          },
        },
      }),
    ],
  },
};
```

### 3. Secure Token Storage

```javascript
// src/core/plugins/auth/secure-storage.js
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'swagger_ui_auth';
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key-change-in-production';

export const SecureStorage = {
  setToken: (token) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(token), ENCRYPTION_KEY).toString();
      sessionStorage.setItem(STORAGE_KEY, encrypted);
      // Fallback to memory storage if sessionStorage fails
      window.__authToken = token;
    } catch (e) {
      console.error('Failed to store token securely');
    }
  },
  
  getToken: () => {
    try {
      const encrypted = sessionStorage.getItem(STORAGE_KEY);
      if (encrypted) {
        const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      }
      return window.__authToken;
    } catch (e) {
      console.error('Failed to retrieve token');
      return null;
    }
  },
  
  clearToken: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    delete window.__authToken;
  }
};
```

### 4. Input Validation Enhancement

```javascript
// src/core/utils/validation.js
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol for potentially dangerous content
  sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))/gi, '');
  
  return sanitized;
};

export const validateApiKey = (apiKey) => {
  // API key format validation
  const apiKeyPattern = /^[A-Za-z0-9\-_]{20,}$/;
  return apiKeyPattern.test(apiKey);
};

export const validateUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Allow only http(s) protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
```

### 5. Enhanced Error Handling

```javascript
// src/core/plugins/errors/error-boundary.jsx
import React from 'react';

class SecurityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to render fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service (not console in production)
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service like Sentry
      window.errorReporter?.captureException(error, { errorInfo });
    } else {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>We've encountered an error. Please refresh the page or contact support.</p>
          {process.env.NODE_ENV !== 'production' && (
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecurityErrorBoundary;
```

## Docker Security Hardening

```dockerfile
# Dockerfile - Security enhancements
FROM nginx:1.29.1-alpine

# Run as non-root user
RUN addgroup -g 1001 -S swagger && \
    adduser -u 1001 -S swagger -G swagger

# Security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy files with proper permissions
COPY --chown=swagger:swagger ./dist /usr/share/nginx/html
COPY --chown=swagger:swagger ./docker/nginx.conf /etc/nginx/conf.d/default.conf

# Security configurations
RUN rm /etc/nginx/conf.d/default.conf && \
    chown -R swagger:swagger /usr/share/nginx/html && \
    chown -R swagger:swagger /var/cache/nginx && \
    chown -R swagger:swagger /var/log/nginx && \
    chown -R swagger:swagger /etc/nginx/conf.d

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

USER swagger

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

## Environment Variables Security

```bash
# .env.production
REACT_APP_ENCRYPTION_KEY=${ENCRYPTION_KEY}
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_HOSTS=https://api.swagger.io,https://petstore.swagger.io
REACT_APP_CSP_NONCE=${CSP_NONCE}
```

## Security Testing Script

```json
// package.json - Add security scripts
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:check": "npm run security:audit && npm run security:headers",
    "security:headers": "curl -I http://localhost:8080 | grep -E '(Strict-Transport|X-Frame|X-Content|Content-Security)'",
    "security:scan": "docker run --rm -v \"$PWD\":/src aquasec/trivy fs /src",
    "security:owasp": "dependency-check --scan . --format HTML --out dependency-check-report.html"
  }
}
```

## Implementation Checklist

### Phase 1: Critical Security (Week 1)
- [ ] Implement all security headers in nginx.conf
- [ ] Configure TerserPlugin to remove console.logs
- [ ] Replace localStorage with SecureStorage
- [ ] Add input validation to all user inputs
- [ ] Implement error boundary

### Phase 2: Infrastructure (Week 2)
- [ ] Update Dockerfile with security hardening
- [ ] Configure environment variables securely
- [ ] Implement health checks
- [ ] Set up rate limiting

### Phase 3: Testing & Monitoring (Week 3)
- [ ] Add security testing scripts
- [ ] Implement automated security scanning
- [ ] Set up dependency vulnerability checking
- [ ] Configure security monitoring

## Monitoring & Alerting

```javascript
// src/core/plugins/monitoring/security-monitor.js
class SecurityMonitor {
  constructor() {
    this.violations = [];
    this.setupCSPMonitoring();
  }

  setupCSPMonitoring() {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      this.logViolation({
        type: 'CSP',
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        lineNumber: e.lineNumber,
        timestamp: new Date().toISOString()
      });
    });
  }

  logViolation(violation) {
    this.violations.push(violation);
    
    // Send to monitoring service
    if (window.errorReporter) {
      window.errorReporter.captureMessage('Security Violation', {
        level: 'warning',
        extra: violation
      });
    }
  }

  getViolations() {
    return this.violations;
  }
}

export default new SecurityMonitor();
```

## Testing Security Improvements

```javascript
// test/security/security.test.js
describe('Security Tests', () => {
  it('should not expose sensitive data in console', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    // Run your code
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate URLs properly', () => {
    expect(validateUrl('https://api.example.com')).toBe(true);
    expect(validateUrl('javascript:alert(1)')).toBe(false);
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('should store tokens securely', () => {
    const token = 'test-token-123';
    SecureStorage.setToken(token);
    expect(sessionStorage.getItem('swagger_ui_auth')).not.toBe(token);
  });
});
```

## Contact for Security Issues

For security vulnerabilities, please report to:
- Email: security@swagger.io
- GitHub Security Advisories: https://github.com/swagger-api/swagger-ui/security/advisories

---

**Note:** These recommendations should be implemented and tested in a staging environment before deploying to production. Always backup your configuration before making changes.