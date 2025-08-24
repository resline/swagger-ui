#!/bin/bash

# Secrets Management Script for Swagger UI
# This script helps generate, manage, and rotate secrets securely

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SECRETS_DIR="./secrets"
SECRETS_EXAMPLE_DIR="./secrets-example"

# Ensure secrets directory exists
mkdir -p "$SECRETS_DIR"
mkdir -p "$SECRETS_EXAMPLE_DIR"

# Function to generate a random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate API key
generate_api_key() {
    echo "swagger-ui-$(openssl rand -hex 16)"
}

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -hex 64
}

# Function to create secret file
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local secret_file="$SECRETS_DIR/${secret_name}.txt"
    
    echo -n "$secret_value" > "$secret_file"
    chmod 600 "$secret_file"
    echo -e "${GREEN}✅ Created secret: $secret_name${NC}"
}

# Function to create example secret files
create_example_secrets() {
    echo -e "${BLUE}📝 Creating example secret files...${NC}"
    
    # API Key example
    echo "your-api-key-here" > "$SECRETS_EXAMPLE_DIR/api_key.txt.example"
    
    # Grafana password example  
    echo "your-secure-grafana-password" > "$SECRETS_EXAMPLE_DIR/grafana_password.txt.example"
    
    # Database password example
    echo "your-database-password" > "$SECRETS_EXAMPLE_DIR/db_password.txt.example"
    
    # JWT secret example
    echo "your-jwt-secret-64-chars-long" > "$SECRETS_EXAMPLE_DIR/jwt_secret.txt.example"
    
    # SSL certificate examples
    cat > "$SECRETS_EXAMPLE_DIR/ssl_cert.pem.example" << 'EOF'
-----BEGIN CERTIFICATE-----
Your SSL certificate content goes here
-----END CERTIFICATE-----
EOF
    
    cat > "$SECRETS_EXAMPLE_DIR/ssl_key.pem.example" << 'EOF'
-----BEGIN PRIVATE KEY-----
Your SSL private key content goes here
-----END PRIVATE KEY-----
EOF
    
    echo -e "${GREEN}✅ Example secret files created in $SECRETS_EXAMPLE_DIR${NC}"
    echo -e "${YELLOW}📋 Copy and modify these examples to create your actual secrets${NC}"
}

# Function to generate all secrets
generate_all_secrets() {
    echo -e "${BLUE}🔐 Generating all secrets...${NC}"
    
    # Generate API key
    local api_key=$(generate_api_key)
    create_secret "api_key" "$api_key"
    
    # Generate Grafana password
    local grafana_password=$(generate_password 24)
    create_secret "grafana_password" "$grafana_password"
    
    # Generate database password
    local db_password=$(generate_password 32)
    create_secret "db_password" "$db_password"
    
    # Generate JWT secret
    local jwt_secret=$(generate_jwt_secret)
    create_secret "jwt_secret" "$jwt_secret"
    
    echo -e "${GREEN}🎉 All secrets generated successfully!${NC}"
    echo -e "${YELLOW}📋 Remember to:"
    echo -e "   1. Backup these secrets securely"
    echo -e "   2. Never commit secrets to version control"
    echo -e "   3. Rotate secrets regularly${NC}"
}

# Function to generate self-signed SSL certificate
generate_ssl_cert() {
    local domain=${1:-localhost}
    
    echo -e "${BLUE}🔒 Generating self-signed SSL certificate for $domain...${NC}"
    
    # Create private key
    openssl genrsa -out "$SECRETS_DIR/ssl_key.pem" 2048
    
    # Create certificate signing request
    openssl req -new -key "$SECRETS_DIR/ssl_key.pem" -out "$SECRETS_DIR/ssl_cert.csr" -subj "/C=US/ST=CA/L=San Francisco/O=Swagger UI/CN=$domain"
    
    # Create self-signed certificate
    openssl x509 -req -in "$SECRETS_DIR/ssl_cert.csr" -signkey "$SECRETS_DIR/ssl_key.pem" -out "$SECRETS_DIR/ssl_cert.pem" -days 365
    
    # Clean up CSR
    rm "$SECRETS_DIR/ssl_cert.csr"
    
    # Set proper permissions
    chmod 600 "$SECRETS_DIR/ssl_key.pem" "$SECRETS_DIR/ssl_cert.pem"
    
    echo -e "${GREEN}✅ SSL certificate generated for $domain${NC}"
}

# Function to validate secrets
validate_secrets() {
    echo -e "${BLUE}🔍 Validating secrets...${NC}"
    
    local secrets_list=("api_key" "grafana_password" "db_password" "jwt_secret")
    local missing_secrets=()
    
    for secret in "${secrets_list[@]}"; do
        if [ ! -f "$SECRETS_DIR/${secret}.txt" ]; then
            missing_secrets+=("$secret")
        else
            echo -e "${GREEN}✅ Found: $secret${NC}"
        fi
    done
    
    if [ ${#missing_secrets[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing secrets:${NC}"
        for secret in "${missing_secrets[@]}"; do
            echo -e "${RED}   - $secret${NC}"
        done
        return 1
    else
        echo -e "${GREEN}🎉 All required secrets are present!${NC}"
        return 0
    fi
}

# Function to rotate secrets
rotate_secrets() {
    echo -e "${BLUE}🔄 Rotating secrets...${NC}"
    
    # Backup current secrets
    local backup_dir="$SECRETS_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -n "$(ls -A $SECRETS_DIR/*.txt 2>/dev/null)" ]; then
        cp "$SECRETS_DIR"/*.txt "$backup_dir"/
        echo -e "${GREEN}✅ Current secrets backed up to $backup_dir${NC}"
    fi
    
    # Generate new secrets
    generate_all_secrets
    
    echo -e "${YELLOW}⚠️  Don't forget to restart services to use new secrets!${NC}"
}

# Function to show secrets status
show_status() {
    echo -e "${BLUE}📊 Secrets Status${NC}"
    echo "================="
    
    for secret_file in "$SECRETS_DIR"/*.txt; do
        if [ -f "$secret_file" ]; then
            local filename=$(basename "$secret_file")
            local secret_name="${filename%.txt}"
            local file_size=$(stat -c%s "$secret_file")
            local file_date=$(stat -c%y "$secret_file" | cut -d' ' -f1)
            
            echo -e "${GREEN}✅ $secret_name${NC} ($file_size bytes, created: $file_date)"
        fi
    done
    
    if [ ! -n "$(ls -A $SECRETS_DIR/*.txt 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  No secrets found${NC}"
    fi
}

# Function to clean up secrets (for development)
clean_secrets() {
    echo -e "${RED}🗑️  Cleaning up secrets...${NC}"
    read -p "Are you sure you want to delete all secrets? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$SECRETS_DIR"/*.txt "$SECRETS_DIR"/*.pem
        echo -e "${GREEN}✅ Secrets cleaned up${NC}"
    else
        echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}Swagger UI Secrets Management${NC}"
    echo "============================"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  generate-all    Generate all required secrets"
    echo "  generate-ssl    Generate self-signed SSL certificate"
    echo "  validate       Validate that all secrets exist"
    echo "  rotate         Rotate all secrets (backup old ones)"
    echo "  status         Show status of all secrets"
    echo "  examples       Create example secret files"
    echo "  clean          Clean up all secrets (development only)"
    echo "  help           Show this help message"
    echo
    echo "Examples:"
    echo "  $0 generate-all"
    echo "  $0 generate-ssl mydomain.com"
    echo "  $0 validate"
}

# Main function
main() {
    local command=${1:-help}
    
    case $command in
        "generate-all")
            generate_all_secrets
            ;;
        "generate-ssl")
            generate_ssl_cert "${2:-localhost}"
            ;;
        "validate")
            validate_secrets
            ;;
        "rotate")
            rotate_secrets
            ;;
        "status")
            show_status
            ;;
        "examples")
            create_example_secrets
            ;;
        "clean")
            clean_secrets
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ ERROR: openssl is required but not installed${NC}"
    exit 1
fi

# Run main function
main "$@"