#!/bin/bash

# Environment Validation Script for Swagger UI
# This script validates environment variables and configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PORT=8080
DEFAULT_BASE_URL="/"
DEFAULT_CORS="true"
DEFAULT_EMBEDDING="false"

echo -e "${BLUE}🔍 Swagger UI Environment Validation${NC}"
echo "========================================"

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value=${!var_name:-}
    local is_required=${2:-false}
    local default_value=${3:-}

    if [ -z "$var_value" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}❌ ERROR: Required variable $var_name is not set${NC}"
            return 1
        elif [ -n "$default_value" ]; then
            echo -e "${YELLOW}⚠️  WARNING: $var_name not set, using default: $default_value${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  WARNING: Optional variable $var_name is not set${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $var_name: $var_value${NC}"
        return 0
    fi
}

# Function to validate port number
validate_port() {
    local port_name=$1
    local port_value=${!port_name:-}
    
    if [ -n "$port_value" ]; then
        if [[ "$port_value" =~ ^[0-9]+$ ]] && [ "$port_value" -ge 1 ] && [ "$port_value" -le 65535 ]; then
            echo -e "${GREEN}✅ $port_name: $port_value (valid port)${NC}"
            return 0
        else
            echo -e "${RED}❌ ERROR: $port_name ($port_value) is not a valid port number${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  WARNING: $port_name is not set${NC}"
        return 0
    fi
}

# Function to validate boolean values
validate_boolean() {
    local var_name=$1
    local var_value=${!var_name:-}
    
    if [ -n "$var_value" ]; then
        if [[ "$var_value" =~ ^(true|false|TRUE|FALSE|1|0)$ ]]; then
            echo -e "${GREEN}✅ $var_name: $var_value (valid boolean)${NC}"
            return 0
        else
            echo -e "${RED}❌ ERROR: $var_name ($var_value) must be true/false${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  WARNING: $var_name is not set${NC}"
        return 0
    fi
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  WARNING: .env file not found. Using environment variables or defaults.${NC}"
        echo -e "${BLUE}💡 TIP: Copy .env.example to .env and customize for your environment${NC}"
        return 0
    else
        echo -e "${GREEN}✅ .env file found${NC}"
        return 0
    fi
}

# Function to validate URLs
validate_url() {
    local var_name=$1
    local var_value=${!var_name:-}
    
    if [ -n "$var_value" ]; then
        if [[ "$var_value" =~ ^https?:// ]]; then
            echo -e "${GREEN}✅ $var_name: $var_value (valid URL)${NC}"
            return 0
        else
            echo -e "${RED}❌ ERROR: $var_name ($var_value) is not a valid URL${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  INFO: $var_name is not set (optional)${NC}"
        return 0
    fi
}

# Function to validate password strength
validate_password_strength() {
    local var_name=$1
    local password=${!var_name:-}
    
    if [ -z "$password" ]; then
        echo -e "${YELLOW}⚠️  WARNING: $var_name is not set${NC}"
        return 1
    fi
    
    # Check for placeholder values
    if [[ "$password" =~ ^CHANGE_ME.*REQUIRED$ ]] || [[ "$password" =~ ^CHANGE_ME.*IF_USED$ ]] || [[ "$password" =~ ^your-.* ]] || [[ "$password" =~ ^please-change-.* ]]; then
        echo -e "${RED}❌ SECURITY ERROR: $var_name uses placeholder value - must be changed!${NC}"
        return 1
    fi
    
    # Check minimum length (16 characters)
    if [ ${#password} -lt 16 ]; then
        echo -e "${RED}❌ SECURITY ERROR: $var_name is too short (minimum 16 characters)${NC}"
        return 1
    fi
    
    # Check for complexity requirements
    local has_lower=false
    local has_upper=false
    local has_digit=false
    local has_special=false
    
    if [[ "$password" =~ [a-z] ]]; then has_lower=true; fi
    if [[ "$password" =~ [A-Z] ]]; then has_upper=true; fi
    if [[ "$password" =~ [0-9] ]]; then has_digit=true; fi
    if [[ "$password" =~ [^a-zA-Z0-9] ]]; then has_special=true; fi
    
    local missing_requirements=()
    
    if [ "$has_lower" = false ]; then missing_requirements+=("lowercase letter"); fi
    if [ "$has_upper" = false ]; then missing_requirements+=("uppercase letter"); fi
    if [ "$has_digit" = false ]; then missing_requirements+=("number"); fi
    if [ "$has_special" = false ]; then missing_requirements+=("special character"); fi
    
    if [ ${#missing_requirements[@]} -gt 0 ]; then
        echo -e "${RED}❌ SECURITY ERROR: $var_name missing: ${missing_requirements[*]}${NC}"
        return 1
    fi
    
    # Check for common weak passwords
    local common_patterns=("password" "admin" "123" "qwerty" "letmein" "welcome")
    local password_lower=$(echo "$password" | tr '[:upper:]' '[:lower:]')
    
    for pattern in "${common_patterns[@]}"; do
        if [[ "$password_lower" =~ $pattern ]]; then
            echo -e "${RED}❌ SECURITY ERROR: $var_name contains common pattern '$pattern'${NC}"
            return 1
        fi
    done
    
    # Check for repeated characters (more than 3 in a row)
    if [[ "$password" =~ (.)\1{3,} ]]; then
        echo -e "${RED}❌ SECURITY ERROR: $var_name has too many repeated characters${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ $var_name: Strong password (${#password} characters)${NC}"
    return 0
}

# Function to check security configuration
check_security_config() {
    echo -e "\n${BLUE}🔒 Security Configuration${NC}"
    echo "=========================="
    
    local security_errors=0
    
    # Check for default/weak passwords
    validate_password_strength "GRAFANA_PASSWORD" || security_errors=$((security_errors + 1))
    
    # Check Elasticsearch password if set
    if [ -n "${ELASTIC_PASSWORD:-}" ] && [ "${ELASTIC_PASSWORD}" != "your-secure-elasticsearch-password-here" ] && [ "${ELASTIC_PASSWORD}" != "please-change-default-elastic-password" ]; then
        validate_password_strength "ELASTIC_PASSWORD" || security_errors=$((security_errors + 1))
    elif [ "${ELASTIC_PASSWORD:-}" = "please-change-default-elastic-password" ] || [ "${ELASTIC_PASSWORD:-}" = "changeme" ]; then
        echo -e "${RED}❌ SECURITY ERROR: ELASTIC_PASSWORD uses default/placeholder value - must be changed!${NC}"
        security_errors=$((security_errors + 1))
    fi
    
    # Check Kibana system password if set
    if [ -n "${KIBANA_SYSTEM_PASSWORD:-}" ] && [ "${KIBANA_SYSTEM_PASSWORD}" != "your-secure-kibana-system-password-here" ] && [ "${KIBANA_SYSTEM_PASSWORD}" != "please-change-default-kibana-password" ]; then
        validate_password_strength "KIBANA_SYSTEM_PASSWORD" || security_errors=$((security_errors + 1))
    elif [ "${KIBANA_SYSTEM_PASSWORD:-}" = "please-change-default-kibana-password" ] || [ "${KIBANA_SYSTEM_PASSWORD:-}" = "changeme" ]; then
        echo -e "${RED}❌ SECURITY ERROR: KIBANA_SYSTEM_PASSWORD uses default/placeholder value - must be changed!${NC}"
        security_errors=$((security_errors + 1))
    fi
    
    # Check Kibana encryption key if set
    if [ -n "${KIBANA_ENCRYPTION_KEY:-}" ]; then
        if [[ "${KIBANA_ENCRYPTION_KEY}" =~ ^your-.* ]] || [[ "${KIBANA_ENCRYPTION_KEY}" =~ ^please-change-.* ]] || [[ "${KIBANA_ENCRYPTION_KEY}" =~ changeme ]]; then
            echo -e "${RED}❌ SECURITY ERROR: KIBANA_ENCRYPTION_KEY uses default/placeholder value - must be changed!${NC}"
            security_errors=$((security_errors + 1))
        elif [ ${#KIBANA_ENCRYPTION_KEY} -ne 32 ]; then
            echo -e "${RED}❌ SECURITY ERROR: KIBANA_ENCRYPTION_KEY must be exactly 32 characters${NC}"
            security_errors=$((security_errors + 1))
        else
            echo -e "${GREEN}✅ KIBANA_ENCRYPTION_KEY: Proper length (32 characters)${NC}"
        fi
    fi
    
    # Check API key if set
    if [ -n "${API_KEY:-}" ]; then
        if [[ "${API_KEY}" =~ ^CHANGE_ME.*REQUIRED$ ]] || [[ "${API_KEY}" =~ ^your-.* ]]; then
            echo -e "${RED}❌ SECURITY ERROR: API_KEY uses placeholder value - must be changed!${NC}"
            security_errors=$((security_errors + 1))
        elif [ ${#API_KEY} -lt 32 ]; then
            echo -e "${RED}❌ SECURITY ERROR: API_KEY too short (minimum 32 characters)${NC}"
            security_errors=$((security_errors + 1))
        else
            echo -e "${GREEN}✅ API_KEY: Sufficient length (${#API_KEY} characters)${NC}"
        fi
    fi
    
    # Check database password if set
    if [ -n "${DB_PASSWORD:-}" ] && [ "${DB_PASSWORD}" != "CHANGE_ME_SECURE_DB_PASSWORD_IF_USED" ] && [ "${DB_PASSWORD}" != "your-secure-database-password-here" ]; then
        validate_password_strength "DB_PASSWORD" || security_errors=$((security_errors + 1))
    fi
    
    # Check if running in production with debug enabled
    if [ "${NODE_ENV:-}" = "production" ] && [ "${DEBUG:-}" = "true" ]; then
        echo -e "${RED}❌ SECURITY ERROR: Debug mode enabled in production!${NC}"
        security_errors=$((security_errors + 1))
    fi
    
    # Check SSL configuration for production
    if [ "${NODE_ENV:-}" = "production" ] && [ "${FORCE_HTTPS:-}" != "true" ]; then
        echo -e "${YELLOW}⚠️  SECURITY WARNING: HTTPS not enforced in production${NC}"
    fi
    
    # Check for development mode in production
    if [ "${NODE_ENV:-}" = "production" ] && [ "${DEVELOPMENT_MODE:-}" = "true" ]; then
        echo -e "${RED}❌ SECURITY ERROR: Development mode enabled in production!${NC}"
        security_errors=$((security_errors + 1))
    fi
    
    return $security_errors
}

# Main validation
main() {
    local exit_code=0
    
    echo -e "\n${BLUE}📁 Environment File Check${NC}"
    echo "=========================="
    check_env_file || exit_code=1
    
    echo -e "\n${BLUE}🔧 Core Application Configuration${NC}"
    echo "=================================="
    validate_port "SWAGGER_UI_PORT" || exit_code=1
    check_var "BASE_URL" false "$DEFAULT_BASE_URL" || exit_code=1
    validate_boolean "CORS" || exit_code=1
    validate_boolean "EMBEDDING" || exit_code=1
    validate_url "SWAGGER_JSON_URL" || exit_code=1
    
    echo -e "\n${BLUE}📊 Monitoring Configuration${NC}"
    echo "============================"
    validate_port "PROMETHEUS_PORT" || exit_code=1
    validate_port "GRAFANA_PORT" || exit_code=1
    validate_port "NGINX_EXPORTER_PORT" || exit_code=1
    validate_port "ELASTICSEARCH_PORT" || exit_code=1
    validate_port "KIBANA_PORT" || exit_code=1
    
    echo -e "\n${BLUE}🔐 Credentials Configuration${NC}"
    echo "============================="
    check_var "GRAFANA_USER" false "admin" || exit_code=1
    check_var "GRAFANA_PASSWORD" true || exit_code=1
    
    echo -e "\n${BLUE}⚡ Performance Configuration${NC}"
    echo "============================"
    check_var "NGINX_WORKER_PROCESSES" false "auto" || exit_code=1
    check_var "NGINX_WORKER_CONNECTIONS" false "1024" || exit_code=1
    
    echo -e "\n${BLUE}🛡️  Security Configuration${NC}"
    echo "==========================="
    validate_boolean "RUN_AS_NON_ROOT" || exit_code=1
    validate_boolean "READ_ONLY_ROOT_FILESYSTEM" || exit_code=1
    validate_boolean "NO_NEW_PRIVILEGES" || exit_code=1
    
    # Additional security checks
    check_security_config || exit_code=$((exit_code + $?))
    
    # Summary
    echo -e "\n${BLUE}📋 Validation Summary${NC}"
    echo "===================="
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Environment validation completed successfully!${NC}"
        echo -e "${GREEN}🚀 Ready to deploy Swagger UI${NC}"
    else
        echo -e "${RED}❌ Environment validation failed with $exit_code errors!${NC}"
        echo -e "${RED}🛠️  Please fix the security errors above before deploying${NC}"
        echo -e "${YELLOW}💡 Use './scripts/manage-secrets.sh generate-password' to create secure passwords${NC}"
        exit $exit_code
    fi
}

# Load .env file if it exists
if [ -f ".env" ]; then
    set -o allexport
    source .env
    set +o allexport
fi

# Run validation
main "$@"