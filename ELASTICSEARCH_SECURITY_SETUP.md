# Elasticsearch Security Setup Guide

This guide explains how to set up secure authentication for the Elasticsearch stack (Elasticsearch, Kibana, and Filebeat) in the Swagger UI monitoring environment.

## Security Changes Implemented

### 1. Elasticsearch Security
- **Enabled X-Pack Security**: `xpack.security.enabled=true`
- **Disabled SSL/TLS**: For initial setup (can be enabled later)
- **Native Authentication**: Using built-in user database
- **Superuser Bootstrap**: Uses `ELASTIC_PASSWORD` environment variable

### 2. Kibana Security
- **Authentication**: Connects to Elasticsearch using `kibana_system` user
- **Encryption Keys**: Three encryption keys for security features
- **X-Pack Security**: Enabled with authentication

### 3. Filebeat Security
- **Authentication**: Uses `elastic` user credentials
- **Secure Monitoring**: Authenticated connection to Elasticsearch

## Required Environment Variables

Add these to your `.env` file (copy from `.env.example`):

```bash
# Elasticsearch superuser password (minimum 16 characters)
ELASTIC_PASSWORD=your_secure_elastic_password_here

# Kibana system user password (minimum 16 characters)  
KIBANA_SYSTEM_PASSWORD=your_secure_kibana_system_password_here

# Kibana encryption key (exactly 32 characters)
KIBANA_ENCRYPTION_KEY=your_32_character_kibana_encryption_key
```

## Initial Setup Process

### 1. Generate Secure Passwords
```bash
# Generate all Elasticsearch passwords at once
./scripts/manage-secrets.sh generate-elastic-passwords

# Or generate individual passwords
./scripts/manage-secrets.sh generate-password 24    # For ELASTIC_PASSWORD
./scripts/manage-secrets.sh generate-password 20    # For KIBANA_SYSTEM_PASSWORD  
./scripts/manage-secrets.sh generate-kibana-key     # For KIBANA_ENCRYPTION_KEY
```

### 2. Update Environment File
```bash
# Copy example file
cp .env.example .env

# Edit .env file and replace the CHANGE_ME_ values with generated passwords
nano .env
```

### 3. Start the Stack
```bash
# Start Elasticsearch first (it needs to initialize)
docker compose up elasticsearch -d

# Wait for Elasticsearch to be ready (check logs)
docker compose logs -f elasticsearch

# Once ready, start Kibana
docker compose up kibana -d

# Finally start Filebeat
docker compose up filebeat -d

# Or start everything together
docker compose up -d
```

### 4. Create Kibana System User Password
After Elasticsearch starts, you need to set the `kibana_system` user password:

```bash
# Set the kibana_system password (replace with your actual password)
docker compose exec elasticsearch /usr/share/elasticsearch/bin/elasticsearch-reset-password \
  -u kibana_system --password YOUR_KIBANA_SYSTEM_PASSWORD
```

## Verification Steps

### 1. Check Elasticsearch Authentication
```bash
# Should require authentication (will prompt for password)
curl -u elastic:YOUR_ELASTIC_PASSWORD http://localhost:9200/_cluster/health

# Should return 401 without credentials
curl http://localhost:9200/_cluster/health
```

### 2. Access Kibana
- Open http://localhost:5601
- Login with:
  - Username: `elastic`
  - Password: `YOUR_ELASTIC_PASSWORD`

### 3. Check Filebeat Data
- In Kibana, go to Stack Management > Index Management
- Look for `swagger-ui-*` indices
- Verify data is being ingested

## Security Best Practices

### Password Requirements
- **Minimum 16 characters**
- **Mixed case letters** (A-Z, a-z)
- **Numbers** (0-9) 
- **Special characters** (!@#$%^&*)
- **Unique passwords** for each service
- **Regular rotation** (every 90 days recommended)

### Operational Security
- **Never use default passwords** in production
- **Store passwords securely** (use a password manager)
- **Limit access** to the `.env` file
- **Regular backups** of Elasticsearch data
- **Monitor logs** for authentication failures
- **Update regularly** to latest versions

## Troubleshooting

### Common Issues

1. **Kibana can't connect to Elasticsearch**
   - Verify `ELASTIC_PASSWORD` matches
   - Check `kibana_system` user password is set correctly
   - Ensure Elasticsearch is fully started before Kibana

2. **Filebeat authentication fails**
   - Verify `ELASTIC_PASSWORD` in environment
   - Check Filebeat logs: `docker compose logs filebeat`
   - Ensure Elasticsearch is ready

3. **"Bootstrap password" errors**
   - Delete Elasticsearch data volume: `docker compose down -v`
   - Restart with correct `ELASTIC_PASSWORD`

### Container Health Checks
```bash
# Check all service health
docker compose ps

# Check specific service logs
docker compose logs elasticsearch
docker compose logs kibana  
docker compose logs filebeat
```

## Advanced Configuration

### Enable SSL/TLS (Production)
To enable SSL encryption between services:

1. Generate certificates:
```bash
./scripts/manage-secrets.sh generate-ssl your-domain.com
```

2. Update docker-compose.yml:
```yaml
# In elasticsearch service environment:
- xpack.security.http.ssl.enabled=true
- xpack.security.transport.ssl.enabled=true
```

3. Update connection URLs to use `https://`

### Additional Users
Create additional users for different applications:

```bash
# Access Elasticsearch container
docker compose exec elasticsearch bash

# Create a new user
/usr/share/elasticsearch/bin/elasticsearch-users useradd myapp \
  -p mypassword -r logstash_writer
```

## Backup and Recovery

### Backup Elasticsearch Data
```bash
# Create snapshot repository (in Kibana Dev Tools)
PUT /_snapshot/backup_repo
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}

# Create snapshot
PUT /_snapshot/backup_repo/snapshot_1
```

### Backup Passwords
- Store passwords in secure password manager
- Keep encrypted backup of `.env` file
- Document all service accounts and their purposes

---

**⚠️ Security Warning**: This configuration disables SSL/TLS for initial setup. For production environments, enable SSL/TLS encryption and use proper certificates.

**📋 Next Steps**: After successful setup, consider implementing SSL/TLS, additional user accounts, and automated backup procedures.