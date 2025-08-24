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

# Function to check security configuration
check_security_config() {
    echo -e "\n${BLUE}🔒 Security Configuration${NC}"
    echo "=========================="
    
    # Check if default passwords are being used
    if [ "${GRAFANA_PASSWORD:-}" = "admin123" ]; then
        echo -e "${RED}❌ SECURITY WARNING: Using default Grafana password!${NC}"
        echo -e "${YELLOW}   Please change GRAFANA_PASSWORD in your .env file${NC}"
    fi
    
    # Check if running in production with debug enabled
    if [ "${NODE_ENV:-}" = "production" ] && [ "${DEBUG:-}" = "true" ]; then
        echo -e "${RED}❌ SECURITY WARNING: Debug mode enabled in production!${NC}"
    fi
    
    # Check SSL configuration for production
    if [ "${NODE_ENV:-}" = "production" ] && [ "${FORCE_HTTPS:-}" != "true" ]; then
        echo -e "${YELLOW}⚠️  SECURITY WARNING: HTTPS not enforced in production${NC}"
    fi
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
    check_security_config
    
    # Summary
    echo -e "\n${BLUE}📋 Validation Summary${NC}"
    echo "===================="
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Environment validation completed successfully!${NC}"
        echo -e "${GREEN}🚀 Ready to deploy Swagger UI${NC}"
    else
        echo -e "${RED}❌ Environment validation failed!${NC}"
        echo -e "${RED}🛠️  Please fix the errors above before deploying${NC}"
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