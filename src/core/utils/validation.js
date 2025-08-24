/**
 * Input Validation and Sanitization Utilities
 * Provides comprehensive validation and sanitization for user inputs
 */

// Common regex patterns
const PATTERNS = {
  // API Key validation - allows alphanumeric, dashes, underscores
  API_KEY: /^[a-zA-Z0-9_-]{8,128}$/,
  
  // URL validation - enhanced pattern for various URL schemes
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?$/,
  
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Username validation - alphanumeric with limited special characters
  USERNAME: /^[a-zA-Z0-9._-]{3,50}$/,
  
  // Client ID validation for OAuth
  CLIENT_ID: /^[a-zA-Z0-9._-]{4,100}$/,
  
  // Scope validation for OAuth
  SCOPE: /^[a-zA-Z0-9:._\-\s]{1,200}$/,
  
  // Token validation - base64 like pattern
  TOKEN: /^[a-zA-Z0-9+/=._-]{10,2048}$/,
  
  // Path validation - for API paths
  API_PATH: /^\/[a-zA-Z0-9\/_.-]*$/
}

// Dangerous patterns to detect
const DANGEROUS_PATTERNS = {
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  HTML_TAGS: /<[^>]*>/g,
  JAVASCRIPT_PROTOCOL: /^\s*javascript:/i,
  DATA_PROTOCOL: /^\s*data:/i,
  VBSCRIPT_PROTOCOL: /^\s*vbscript:/i,
  SQL_INJECTION: /(union|select|insert|delete|update|drop|create|alter|exec|execute)\s/gi,
  XSS_PATTERNS: /(\bon\w+\s*=|javascript:|data:|vbscript:)/gi
}

/**
 * Sanitize string input by removing/escaping dangerous characters
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return ''
  }

  const {
    allowHtml = false,
    maxLength = 1000,
    trim = true,
    removeScripts = true
  } = options

  let sanitized = input

  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim()
  }

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // Remove script tags
  if (removeScripts) {
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.SCRIPT_TAGS, '')
  }

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.HTML_TAGS, '')
  }

  // HTML encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  return sanitized
}

/**
 * Validate API key format and security
 */
export function validateApiKey(apiKey) {
  const errors = []
  
  if (!apiKey || typeof apiKey !== 'string') {
    errors.push('API key is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(apiKey, { trim: true, maxLength: 128 })
  
  // Check length
  if (sanitized.length < 8) {
    errors.push('API key must be at least 8 characters long')
  }
  
  if (sanitized.length > 128) {
    errors.push('API key must not exceed 128 characters')
  }

  // Check pattern
  if (!PATTERNS.API_KEY.test(sanitized)) {
    errors.push('API key contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed')
  }

  // Check for obvious weak patterns
  if (/^(test|demo|sample|example|key)/i.test(sanitized)) {
    errors.push('API key appears to be a test/demo key')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate URL format and security
 */
export function validateUrl(url) {
  const errors = []
  
  if (!url || typeof url !== 'string') {
    errors.push('URL is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(url, { trim: true, maxLength: 2048 })

  // Check for dangerous protocols
  if (DANGEROUS_PATTERNS.JAVASCRIPT_PROTOCOL.test(sanitized) ||
      DANGEROUS_PATTERNS.DATA_PROTOCOL.test(sanitized) ||
      DANGEROUS_PATTERNS.VBSCRIPT_PROTOCOL.test(sanitized)) {
    errors.push('URL contains dangerous protocol')
  }

  // Basic URL format validation
  if (!PATTERNS.URL.test(sanitized)) {
    errors.push('Invalid URL format')
  }

  // Check for localhost/private IPs in production
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(sanitized)
  if (isLocalhost && process.env.NODE_ENV === 'production') {
    errors.push('Localhost URLs are not allowed in production')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate OAuth client credentials
 */
export function validateOAuthCredentials(credentials) {
  const errors = []
  const sanitized = {}

  if (!credentials || typeof credentials !== 'object') {
    errors.push('Credentials must be an object')
    return { isValid: false, errors, sanitized: {} }
  }

  // Validate client ID
  if (credentials.clientId) {
    const clientIdResult = validateClientId(credentials.clientId)
    if (!clientIdResult.isValid) {
      errors.push(...clientIdResult.errors.map(e => `Client ID: ${e}`))
    } else {
      sanitized.clientId = clientIdResult.sanitized
    }
  }

  // Validate client secret
  if (credentials.clientSecret) {
    const clientSecretResult = validateClientSecret(credentials.clientSecret)
    if (!clientSecretResult.isValid) {
      errors.push(...clientSecretResult.errors.map(e => `Client Secret: ${e}`))
    } else {
      sanitized.clientSecret = clientSecretResult.sanitized
    }
  }

  // Validate scopes
  if (credentials.scopes) {
    const scopesResult = validateScopes(credentials.scopes)
    if (!scopesResult.isValid) {
      errors.push(...scopesResult.errors.map(e => `Scopes: ${e}`))
    } else {
      sanitized.scopes = scopesResult.sanitized
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate client ID
 */
function validateClientId(clientId) {
  const errors = []
  
  if (!clientId || typeof clientId !== 'string') {
    errors.push('Client ID is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(clientId, { trim: true, maxLength: 100 })

  if (!PATTERNS.CLIENT_ID.test(sanitized)) {
    errors.push('Client ID contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate client secret
 */
function validateClientSecret(clientSecret) {
  const errors = []
  
  if (!clientSecret || typeof clientSecret !== 'string') {
    errors.push('Client secret is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(clientSecret, { trim: true, maxLength: 200 })

  if (sanitized.length < 8) {
    errors.push('Client secret must be at least 8 characters long')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate OAuth scopes
 */
function validateScopes(scopes) {
  const errors = []
  let sanitized = []
  
  if (Array.isArray(scopes)) {
    sanitized = scopes
      .filter(scope => typeof scope === 'string')
      .map(scope => sanitizeString(scope, { trim: true, maxLength: 50 }))
      .filter(scope => scope.length > 0 && PATTERNS.SCOPE.test(scope))
  } else if (typeof scopes === 'string') {
    const scopeArray = scopes.split(/[\s,]+/).filter(s => s.length > 0)
    sanitized = scopeArray
      .map(scope => sanitizeString(scope, { trim: true, maxLength: 50 }))
      .filter(scope => scope.length > 0 && PATTERNS.SCOPE.test(scope))
  } else {
    errors.push('Scopes must be an array or space-separated string')
  }

  if (sanitized.length === 0 && scopes) {
    errors.push('No valid scopes found')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate authentication token
 */
export function validateToken(token) {
  const errors = []
  
  if (!token || typeof token !== 'string') {
    errors.push('Token is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(token, { trim: true, maxLength: 2048 })

  if (!PATTERNS.TOKEN.test(sanitized)) {
    errors.push('Token format is invalid')
  }

  if (sanitized.length < 10) {
    errors.push('Token is too short')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate API path
 */
export function validateApiPath(path) {
  const errors = []
  
  if (!path || typeof path !== 'string') {
    errors.push('API path is required and must be a string')
    return { isValid: false, errors, sanitized: '' }
  }

  const sanitized = sanitizeString(path, { trim: true, maxLength: 500 })

  if (!PATTERNS.API_PATH.test(sanitized)) {
    errors.push('API path format is invalid')
  }

  // Check for path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('//')) {
    errors.push('API path contains dangerous patterns')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Check for potential XSS attacks
 */
export function detectXSS(input) {
  if (typeof input !== 'string') {
    return { hasXSS: false, threats: [] }
  }

  const threats = []

  // Check for script tags
  if (DANGEROUS_PATTERNS.SCRIPT_TAGS.test(input)) {
    threats.push('Script tags detected')
  }

  // Check for event handlers
  if (DANGEROUS_PATTERNS.XSS_PATTERNS.test(input)) {
    threats.push('Event handlers or dangerous protocols detected')
  }

  // Check for javascript: protocol
  if (DANGEROUS_PATTERNS.JAVASCRIPT_PROTOCOL.test(input)) {
    threats.push('JavaScript protocol detected')
  }

  return {
    hasXSS: threats.length > 0,
    threats
  }
}

/**
 * Check for potential SQL injection
 */
export function detectSQLInjection(input) {
  if (typeof input !== 'string') {
    return { hasSQLI: false, threats: [] }
  }

  const threats = []

  if (DANGEROUS_PATTERNS.SQL_INJECTION.test(input)) {
    threats.push('SQL keywords detected')
  }

  // Check for common SQL injection patterns
  const sqlPatterns = [
    /'\s*(or|and)\s+'[^']*'/gi,
    /'\s*(or|and)\s+\d+\s*=\s*\d+/gi,
    /union\s+select/gi,
    /drop\s+table/gi
  ]

  sqlPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('SQL injection pattern detected')
    }
  })

  return {
    hasSQLI: threats.length > 0,
    threats
  }
}

/**
 * Comprehensive validation function for all common inputs
 */
export function validateInput(input, type, options = {}) {
  switch (type) {
    case 'apiKey':
      return validateApiKey(input)
    case 'url':
      return validateUrl(input)
    case 'token':
      return validateToken(input)
    case 'apiPath':
      return validateApiPath(input)
    case 'oauth':
      return validateOAuthCredentials(input)
    default:
      return {
        isValid: false,
        errors: [`Unknown validation type: ${type}`],
        sanitized: ''
      }
  }
}