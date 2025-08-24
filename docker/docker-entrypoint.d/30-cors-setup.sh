#!/bin/sh

# CORS Origin Setup Script
# Processes ALLOWED_ORIGINS environment variable and creates nginx map entries

set -e

# Source and destination paths
CORS_CONF_SOURCE="/usr/share/nginx/cors.conf"
CORS_CONF_TEMPLATE="/etc/nginx/cors.conf"

# Copy the CORS template to nginx config directory
if [ -f "$CORS_CONF_SOURCE" ]; then
    cp "$CORS_CONF_SOURCE" "$CORS_CONF_TEMPLATE"
else
    echo "Warning: CORS configuration source not found at $CORS_CONF_SOURCE"
    exit 1
fi
ALLOWED_ORIGINS_MAP=""

# Function to validate origin format
validate_origin() {
    local origin="$1"
    # Basic validation for origin format (http/https with domain)
    if echo "$origin" | grep -qE '^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$'; then
        return 0
    else
        echo "Warning: Invalid origin format '$origin' - skipping"
        return 1
    fi
}

# Process ALLOWED_ORIGINS environment variable
if [ -n "$ALLOWED_ORIGINS" ]; then
    echo "Processing ALLOWED_ORIGINS: $ALLOWED_ORIGINS"
    
    # Split comma-separated origins and create map entries
    IFS=','
    for origin in $ALLOWED_ORIGINS; do
        # Trim whitespace
        origin=$(echo "$origin" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        if validate_origin "$origin"; then
            # Add map entry: "origin" "origin";
            ALLOWED_ORIGINS_MAP="$ALLOWED_ORIGINS_MAP    \"$origin\" \"$origin\";\n"
            echo "Added allowed origin: $origin"
        fi
    done
    unset IFS
else
    echo "No ALLOWED_ORIGINS specified - CORS will be restricted to same-origin only"
fi

# Substitute the ALLOWED_ORIGINS_MAP in the CORS configuration
if [ -f "$CORS_CONF_TEMPLATE" ]; then
    # Use environment variable substitution to replace ${ALLOWED_ORIGINS_MAP}
    # Create temporary file with substituted content
    TEMP_CONF=$(mktemp)
    
    # Replace the placeholder with actual map entries
    sed "s|\${ALLOWED_ORIGINS_MAP}|$ALLOWED_ORIGINS_MAP|g" "$CORS_CONF_TEMPLATE" > "$TEMP_CONF"
    
    # Move the processed file back
    mv "$TEMP_CONF" "$CORS_CONF_TEMPLATE"
    
    echo "CORS configuration updated successfully"
else
    echo "Warning: CORS configuration template not found at $CORS_CONF_TEMPLATE"
fi

# Log the final CORS configuration for debugging
echo "Final CORS origin mapping:"
if [ -n "$ALLOWED_ORIGINS_MAP" ]; then
    echo -e "$ALLOWED_ORIGINS_MAP"
else
    echo "No cross-origin requests allowed (same-origin only)"
fi