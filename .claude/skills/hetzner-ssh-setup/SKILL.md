---
name: hetzner-ssh-setup
description: "Use when setting up SSH connection to Hetzner server (46.224.12.222) in a new environment. Configures SSH keys from environment variables and Cloudflare Tunnel for reliable access."
---

# Hetzner SSH Setup

## Overview

Configure SSH access to the External Test Environment server (`ubuntu-16gb-fsn1-1`) from a new environment. The server has firewall rules that may block direct SSH from cloud IPs (like GCP), so we use Cloudflare Tunnel as the primary connection method.

## Server Details

| Property | Value |
|----------|-------|
| IP Address | 46.224.12.222 |
| Hostname | ubuntu-16gb-fsn1-1 |
| Location | External Test Environment (Hetzner FSN1 - Falkenstein) |
| User | root |
| SSH Key Type | ed25519 |

## Required Environment Variables

Ensure these are set before running the setup:

| Variable | Description |
|----------|-------------|
| `SSH_PRIVATE_KEY` | Ed25519 private key (single line, space-separated) |
| `SSH_PUBLIC_KEY` | Ed25519 public key |

## Setup Checklist

### 1. Configure SSH Keys

The private key from `SSH_PRIVATE_KEY` env var is stored in single-line format with spaces. It must be reformatted with proper newlines:

```bash
# Create .ssh directory
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# Write properly formatted private key
cat << 'KEYEOF' > ~/.ssh/id_ed25519
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAGSkhWhGYQDmGxUcwiH5ZLFoH49MByT+x6YQErjYcYHgAAAJhx3yKDcd8i
gwAAAAtzc2gtZWQyNTUxOQAAACAGSkhWhGYQDmGxUcwiH5ZLFoH49MByT+x6YQErjYcYHg
AAAECGFpSEES1R6sUNybJsqpTMCR4kwAnn8iqpVZQrsMwUhwZKSFaEZhAOYbFRzCIflksW
gfj0wHJP7HphASuNhxgeAAAAEnRlcnJhZ29uQGRpZnktd29yawECAw==
-----END OPENSSH PRIVATE KEY-----
KEYEOF
chmod 600 ~/.ssh/id_ed25519

# Write public key
echo "$SSH_PUBLIC_KEY" > ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/id_ed25519.pub

# Validate key
ssh-keygen -y -f ~/.ssh/id_ed25519
```

### 2. Install Cloudflare Tunnel Client

Direct SSH to 46.224.12.222 is blocked for most cloud IPs. Use Cloudflare Tunnel:

```bash
# Install cloudflared
curl -L -o /tmp/cloudflared-linux-amd64.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i /tmp/cloudflared-linux-amd64.deb

# Verify installation
cloudflared --version
```

### 3. Get Current Tunnel URL

The Cloudflare Tunnel URL changes when the service restarts. Get the current URL from the server (if you have alternative access) or from the team:

```bash
# On External Test Environment server (if accessible):
grep trycloudflare /var/log/cloudflared.log | tail -1
```

**Current tunnel URL** (may change): `spoken-dolls-agriculture-denver.trycloudflare.com`

### 4. Configure SSH Config

Add convenient alias to `~/.ssh/config`:

```bash
cat >> ~/.ssh/config << 'EOF'

Host ext-test-env
    HostName spoken-dolls-agriculture-denver.trycloudflare.com
    User root
    ProxyCommand cloudflared access tcp --hostname %h
EOF
chmod 600 ~/.ssh/config
```

### 5. Test Connection

```bash
# Via tunnel (recommended)
ssh ext-test-env "echo 'Connection successful!' && hostname && uptime"

# Or with full command
ssh -o ProxyCommand="cloudflared access tcp --hostname spoken-dolls-agriculture-denver.trycloudflare.com" root@localhost "hostname"

# Direct connection (may fail due to firewall)
ssh -o ConnectTimeout=10 root@46.224.12.222 "hostname"
```

## Troubleshooting

### Key Format Error (`error in libcrypto`)

The SSH key must have proper line breaks. The env var stores it in single-line format - use the heredoc method above to write it correctly.

### Direct SSH Timeout

This is expected. The server firewall blocks SSH from most cloud provider IPs. Always use Cloudflare Tunnel.

**Diagnosis:**
```bash
# Check if port is reachable (TCP)
nc -zv 46.224.12.222 22 -w 10

# If "succeeded" but SSH times out = firewall blocking after TCP handshake
# Solution: Use Cloudflare Tunnel
```

### Tunnel URL Changed

If the tunnel URL has changed:
1. Ask team for new URL
2. Update `~/.ssh/config` with new hostname
3. Or use the new URL directly in ProxyCommand

## Quick Setup Script

For automated setup in new environments:

```bash
#!/bin/bash
set -e

# 1. Setup SSH keys
mkdir -p ~/.ssh && chmod 700 ~/.ssh

cat << 'KEYEOF' > ~/.ssh/id_ed25519
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAGSkhWhGYQDmGxUcwiH5ZLFoH49MByT+x6YQErjYcYHgAAAJhx3yKDcd8i
gwAAAAtzc2gtZWQyNTUxOQAAACAGSkhWhGYQDmGxUcwiH5ZLFoH49MByT+x6YQErjYcYHg
AAAECGFpSEES1R6sUNybJsqpTMCR4kwAnn8iqpVZQrsMwUhwZKSFaEZhAOYbFRzCIflksW
gfj0wHJP7HphASuNhxgeAAAAEnRlcnJhZ29uQGRpZnktd29yawECAw==
-----END OPENSSH PRIVATE KEY-----
KEYEOF
chmod 600 ~/.ssh/id_ed25519

# 2. Install cloudflared (if not present)
if ! command -v cloudflared &> /dev/null; then
    curl -L -o /tmp/cloudflared-linux-amd64.deb \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i /tmp/cloudflared-linux-amd64.deb
fi

# 3. Add SSH config
grep -q "Host ext-test-env" ~/.ssh/config 2>/dev/null || cat >> ~/.ssh/config << 'EOF'

Host ext-test-env
    HostName spoken-dolls-agriculture-denver.trycloudflare.com
    User root
    ProxyCommand cloudflared access tcp --hostname %h
EOF
chmod 600 ~/.ssh/config

# 4. Test connection
echo "Testing connection..."
ssh -o ConnectTimeout=30 ext-test-env "echo '✅ External Test Environment SSH setup complete!' && hostname"
```

## Connection Methods Summary

| Method | Command | Reliability |
|--------|---------|-------------|
| Via alias | `ssh ext-test-env` | Recommended |
| Via tunnel | `ssh -o ProxyCommand="cloudflared access tcp --hostname <URL>" root@localhost` | Reliable |
| Direct | `ssh root@46.224.12.222` | Often blocked |
