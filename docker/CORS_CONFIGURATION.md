# CORS Configuration Guide

## Overview
The CORS (Cross-Origin Resource Sharing) configuration has been updated to provide secure origin validation instead of allowing all origins with a wildcard (`*`).

## Security Improvements
- **Removed wildcard CORS**: No longer uses `Access-Control-Allow-Origin: *`
- **Origin whitelist validation**: Only specified origins can make cross-origin requests
- **Default secure behavior**: If no origins are specified, only same-origin requests are allowed
- **Credential support**: Properly handles cookies and authentication headers
- **Enhanced preflight handling**: Improved OPTIONS request processing

## Environment Variables

### ALLOWED_ORIGINS
- **Description**: Comma-separated list of allowed origins for CORS requests
- **Format**: `https://domain.com,https://app.domain.com,http://localhost:3000`
- **Example**: `ALLOWED_ORIGINS="https://myapp.com,https://api.myapp.com,http://localhost:3000"`
- **Default**: Empty (same-origin only)

### CORS
- **Description**: Enable or disable CORS entirely
- **Values**: `true` or `false`
- **Default**: Depends on your docker setup
- **Note**: If set to anything other than `"true"`, CORS will be completely disabled

## Usage Examples

### Production Environment
```bash
# Allow specific production domains
ALLOWED_ORIGINS="https://myapp.com,https://admin.myapp.com"
CORS=true
```

### Development Environment
```bash
# Allow local development servers
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8080,https://dev.myapp.com"
CORS=true
```

### Same-Origin Only (Most Secure)
```bash
# No cross-origin requests allowed
# ALLOWED_ORIGINS=""  # or omit entirely
CORS=true
```

### Disable CORS Completely
```bash
CORS=false
```

## Migration from Previous Configuration

### Before (Insecure)
```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
```

### After (Secure)
```nginx
# Origin validation with environment variable
map $http_origin $cors_allowed_origin {
    default "";
    "https://myapp.com" "https://myapp.com";
    "https://api.myapp.com" "https://api.myapp.com";
}
add_header 'Access-Control-Allow-Origin' $cors_allowed_origin always;
```

## Security Best Practices

1. **Specify exact origins**: Always use full URLs with protocol (https/http)
2. **Use HTTPS in production**: Prefer https:// origins over http://
3. **Minimal origin list**: Only include origins that actually need access
4. **Environment-specific configs**: Use different origin lists for dev/staging/prod
5. **Regular audits**: Review and update allowed origins periodically

## Troubleshooting

### CORS Errors in Browser Console
If you see CORS errors, check:
1. Is the requesting origin included in `ALLOWED_ORIGINS`?
2. Is the origin format correct (including protocol)?
3. Is `CORS=true` set?
4. Are there typos in the origin URLs?

### Debug Mode
To see the processed CORS configuration, check the docker logs during startup. The CORS setup script will output the processed origin mappings.

### Common Issues
- **Mixed protocols**: Don't mix http and https for the same domain
- **Port specificity**: Include port numbers if your app runs on non-standard ports
- **Subdomain exactness**: `app.domain.com` and `domain.com` are different origins
- **Trailing slashes**: Origins should not end with `/`

## Implementation Details

The CORS configuration uses:
- **Nginx map directive**: For efficient origin validation
- **Environment variable substitution**: Dynamic configuration based on deployment
- **Proper preflight handling**: Correct OPTIONS request processing
- **Credential support**: Allows authenticated requests when needed