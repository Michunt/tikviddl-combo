# Deployment & Operations Guide

This guide covers everything you need to know about deploying, scaling, and operating your Cobalt instance in production.

## Table of Contents
- [Environment Variables](#environment-variables)
- [Clustering & Horizontal Scaling](#clustering--horizontal-scaling)
- [Reverse Proxy & CDN Setup](#reverse-proxy--cdn-setup)
- [Monitoring with Docker Logs](#monitoring-with-docker-logs)
- [Updating & Maintenance](#updating--maintenance)

## Environment Variables

Cobalt uses environment variables to configure various aspects of the application. Here's a comprehensive breakdown:

### Rate Limiting Configuration

Control API access and prevent abuse with these variables:

```yaml
# Rate limit window (in seconds) - default: 60
RATELIMIT_WINDOW: 60

# Maximum requests per window - default: 20
RATELIMIT_MAX: 20

# Session creation rate limits
SESSION_RATELIMIT_WINDOW: 60  # Window in seconds
SESSION_RATELIMIT: 10         # Max session creations per window

# Tunnel (proxy/stream) rate limits
TUNNEL_RATELIMIT_WINDOW: 60   # Window in seconds
TUNNEL_RATELIMIT: 40          # Max tunnel requests per window
```

### Duration & Processing Limits

```yaml
# Maximum media duration in seconds (3 hours default)
DURATION_LIMIT: 10800

# Tunnel info storage duration in seconds
TUNNEL_LIFESPAN: 90

# Processing priority (Unix nice value, higher = lower priority)
PROCESSING_PRIORITY: 10
```

### CORS & Security Configuration

```yaml
# Enable CORS wildcard (1 = allow all origins, 0 = restricted)
CORS_WILDCARD: 1

# Specific CORS origin (used when CORS_WILDCARD is 0)
CORS_URL: "https://your-frontend.com"

# Cloudflare Turnstile bot protection
TURNSTILE_SITEKEY: "1x00000000000000000000BB"
TURNSTILE_SECRET: "1x0000000000000000000000000000000AA"

# JWT configuration for session management
JWT_SECRET: "your-random-secret-here"  # Must be 16+ characters
JWT_EXPIRY: 120  # Token validity in seconds

# API authentication
API_AUTH_REQUIRED: 0  # Set to 1 to require auth for all requests
API_KEY_URL: "file:///keys.json"  # Path to API keys file
```

### Core Configuration

```yaml
# Required: Your instance's public URL
API_URL: "https://api.your-domain.com/"

# API port (default: 9000)
API_PORT: 9000

# Listen address (useful for Docker)
API_LISTEN_ADDRESS: "0.0.0.0"

# External proxy for all requests
API_EXTERNAL_PROXY: "http://user:pass@proxy:8080"

# Cookie file path for authenticated services
COOKIE_PATH: "/cookies.json"

# Disable specific services
DISABLED_SERVICES: "bilibili,youtube"

# Force local processing
FORCE_LOCAL_PROCESSING: "never"  # Options: never, session, always
```

### Redis & Clustering

```yaml
# Redis URL for distributed caching and rate limiting
API_REDIS_URL: "redis://localhost:6379"

# Number of cluster instances (requires Redis)
API_INSTANCE_COUNT: 4
```

### Service-Specific Variables

```yaml
# YouTube configuration
CUSTOM_INNERTUBE_CLIENT: "IOS"
YOUTUBE_SESSION_SERVER: "http://localhost:8080/"
YOUTUBE_SESSION_INNERTUBE_CLIENT: "WEB_EMBEDDED"
YOUTUBE_ALLOW_BETTER_AUDIO: 1

# FreeBind for IPv6 rotation (Linux only)
FREEBIND_CIDR: "2001:db8::/32"
```

### Complete Docker Compose Example

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  cobalt:
    image: ghcr.io/imputnet/cobalt:11
    restart: unless-stopped
    depends_on:
      - redis
    ports:
      - "9000:9000"
    environment:
      # Core settings
      API_URL: "https://api.your-domain.com/"
      API_PORT: 9000
      
      # Rate limiting
      RATELIMIT_WINDOW: 60
      RATELIMIT_MAX: 30
      DURATION_LIMIT: 10800
      
      # Security
      CORS_WILDCARD: 0
      CORS_URL: "https://your-frontend.com"
      TURNSTILE_SITEKEY: "${TURNSTILE_SITEKEY}"
      TURNSTILE_SECRET: "${TURNSTILE_SECRET}"
      JWT_SECRET: "${JWT_SECRET}"
      
      # Redis for clustering
      API_REDIS_URL: "redis://redis:6379"
      API_INSTANCE_COUNT: 4
      
      # Optional features
      COOKIE_PATH: "/cookies.json"
    volumes:
      - ./cookies.json:/cookies.json:ro
      - ./keys.json:/keys.json:ro

volumes:
  redis-data:
```

## Clustering & Horizontal Scaling

Cobalt supports horizontal scaling through Node.js clustering and Redis-backed session stores.

### How Clustering Works

1. **Process-level clustering**: Uses Node.js cluster module to spawn multiple worker processes
2. **Shared state via Redis**: All instances share rate limits, cache, and session data
3. **Load balancing**: Requests are automatically distributed across workers

### Enabling Clustering

1. **Install Redis**:
```bash
# Using Docker
docker run -d --name cobalt-redis -p 6379:6379 redis:7-alpine

# Or install locally
sudo apt-get install redis-server
```

2. **Configure environment**:
```yaml
API_REDIS_URL: "redis://localhost:6379"
API_INSTANCE_COUNT: 4  # Number of worker processes
```

3. **Verify clustering**:
```bash
# Check running processes
ps aux | grep cobalt

# Monitor Redis connections
redis-cli CLIENT LIST
```

### Scaling Strategies

#### Vertical Scaling
- Increase `API_INSTANCE_COUNT` based on CPU cores
- Rule of thumb: 1-2 workers per CPU core
- Monitor CPU usage to find optimal count

#### Horizontal Scaling
Run multiple Cobalt instances on different servers:

```yaml
# docker-compose.scale.yml
services:
  cobalt1:
    extends:
      file: docker-compose.yml
      service: cobalt
    environment:
      API_INSTANCE_COUNT: 4

  cobalt2:
    extends:
      file: docker-compose.yml
      service: cobalt
    environment:
      API_INSTANCE_COUNT: 4
```

### Redis Configuration for Production

```redis
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""  # Disable persistence for cache
tcp-keepalive 60
timeout 300
```

## Reverse Proxy & CDN Setup

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/cobalt
upstream cobalt_backend {
    least_conn;
    server 127.0.0.1:9000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:9001 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy settings
    location / {
        proxy_pass http://cobalt_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://cobalt_backend;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req zone=api burst=10 nodelay;
}
```

### CDN Configuration (Cloudflare Example)

1. **DNS Setup**:
   - Point your domain to Cloudflare
   - Enable "Proxied" (orange cloud)

2. **Page Rules**:
   ```
   api.your-domain.com/*
   - Cache Level: Bypass
   - Always Use HTTPS: On
   ```

3. **Firewall Rules**:
   ```
   # Block suspicious patterns
   (http.request.uri.path contains "wp-admin") or
   (http.request.uri.path contains ".php") or
   (http.user_agent contains "bot" and not http.user_agent contains "googlebot")
   ```

4. **DDoS Protection**:
   - Enable "I'm Under Attack" mode if needed
   - Configure rate limiting rules
   - Set up country-based restrictions if required

### Load Balancer Configuration

For high-availability setups:

```yaml
# haproxy.cfg
global
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httplog

backend cobalt_servers
    balance leastconn
    option httpchk GET /health
    server cobalt1 10.0.1.10:9000 check
    server cobalt2 10.0.1.11:9000 check
    server cobalt3 10.0.1.12:9000 check

frontend api_frontend
    bind *:443 ssl crt /etc/ssl/certs/api.pem
    default_backend cobalt_servers
```

## Monitoring with Docker Logs

### Basic Log Monitoring

```bash
# View live logs
docker logs -f cobalt

# View last 100 lines
docker logs --tail 100 cobalt

# View logs with timestamps
docker logs -t cobalt

# Filter logs by time
docker logs --since 2h cobalt
docker logs --since 2024-01-15T10:00:00 cobalt
```

### Advanced Log Analysis

1. **Save logs to file**:
```bash
# Continuous logging
docker logs -f cobalt > cobalt.log 2>&1 &

# Rotate logs daily
docker logs cobalt > "cobalt-$(date +%Y%m%d).log"
```

2. **Parse JSON logs**:
```bash
# Extract errors
docker logs cobalt 2>&1 | grep -i error | jq .

# Count requests by status
docker logs cobalt 2>&1 | jq -r '.status' | sort | uniq -c
```

3. **Monitor specific events**:
```bash
# Watch for rate limit hits
docker logs -f cobalt 2>&1 | grep -i "rate limit"

# Monitor download requests
docker logs -f cobalt 2>&1 | grep "POST /"
```

### Log Management with Docker Compose

```yaml
services:
  cobalt:
    image: ghcr.io/imputnet/cobalt:11
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=cobalt"
```

### Centralized Logging

For production, use a logging stack:

```yaml
# docker-compose.logging.yml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

Logstash configuration:
```ruby
# logstash.conf
input {
  syslog {
    port => 5514
    type => "docker"
  }
}

filter {
  if [type] == "docker" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "cobalt-%{+YYYY.MM.dd}"
  }
}
```

## Updating & Maintenance

### Version Updates via Git

1. **Manual update process**:
```bash
# Navigate to project directory
cd /path/to/cobalt

# Backup current version
cp -r . ../cobalt-backup-$(date +%Y%m%d)

# Pull latest changes
git fetch origin
git checkout main
git pull origin main

# Update dependencies
cd api && pnpm install
cd ../web && pnpm install

# Rebuild and restart
docker-compose build
docker-compose down
docker-compose up -d
```

2. **Automated update script**:
```bash
#!/bin/bash
# update-cobalt.sh

set -e

COBALT_DIR="/opt/cobalt"
BACKUP_DIR="/opt/backups"

echo "Starting Cobalt update..."

# Create backup
BACKUP_NAME="cobalt-$(date +%Y%m%d-%H%M%S)"
cp -r "$COBALT_DIR" "$BACKUP_DIR/$BACKUP_NAME"

# Update code
cd "$COBALT_DIR"
git pull origin main

# Rebuild
docker-compose build --no-cache

# Health check function
health_check() {
    curl -f http://localhost:9000/health || return 1
}

# Rolling restart
docker-compose up -d --no-deps --scale cobalt=0
sleep 5
docker-compose up -d --no-deps --scale cobalt=1

# Wait for health
for i in {1..30}; do
    if health_check; then
        echo "Update successful!"
        exit 0
    fi
    sleep 2
done

echo "Health check failed, rolling back..."
cp -r "$BACKUP_DIR/$BACKUP_NAME"/* "$COBALT_DIR/"
docker-compose up -d --force-recreate
```

3. **Schedule automatic updates**:
```bash
# Add to crontab
0 3 * * 0 /opt/scripts/update-cobalt.sh >> /var/log/cobalt-update.log 2>&1
```

### Zero-Downtime Updates

For critical production environments:

```bash
#!/bin/bash
# zero-downtime-update.sh

# Start new version on different port
docker-compose -f docker-compose.new.yml up -d

# Wait for new version to be healthy
while ! curl -f http://localhost:9001/health; do
    sleep 2
done

# Update load balancer
nginx -s reload

# Stop old version
docker-compose stop

# Move new to primary
mv docker-compose.yml docker-compose.old.yml
mv docker-compose.new.yml docker-compose.yml
```

### Database Migrations

If using external databases:

```bash
# Pre-update backup
docker exec cobalt-redis redis-cli BGSAVE

# Run migrations
docker-compose run --rm cobalt npm run migrate

# Verify
docker-compose run --rm cobalt npm run migrate:status
```

### Monitoring Health

Create a health check script:

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:9000"

# Check API responsive
if ! curl -sf "$API_URL" > /dev/null; then
    echo "API not responding"
    exit 1
fi

# Check Redis connection
if ! docker exec cobalt-redis redis-cli ping > /dev/null; then
    echo "Redis not responding"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "Disk usage critical: ${DISK_USAGE}%"
    exit 1
fi

echo "All systems healthy"
```

### Backup Strategy

1. **Configuration backup**:
```bash
# Backup script
tar -czf "cobalt-config-$(date +%Y%m%d).tar.gz" \
    docker-compose.yml \
    .env \
    cookies.json \
    keys.json \
    nginx.conf
```

2. **Automated backups**:
```yaml
# docker-compose.backup.yml
services:
  backup:
    image: offen/docker-volume-backup:latest
    environment:
      BACKUP_FILENAME: "cobalt-%Y%m%d-%H%M%S.tar.gz"
      BACKUP_PRUNING_PREFIX: "cobalt-"
      BACKUP_RETENTION_DAYS: "7"
    volumes:
      - ./backups:/archive
      - /var/run/docker.sock:/var/run/docker.sock
```

### Performance Tuning

1. **System limits**:
```bash
# /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
```

2. **Docker optimizations**:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
```

3. **Monitoring metrics**:
```bash
# Install monitoring
docker run -d \
  --name=netdata \
  -p 19999:19999 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --cap-add SYS_PTRACE \
  --security-opt apparmor=unconfined \
  netdata/netdata
```

## Best Practices

1. **Security**:
   - Always use HTTPS in production
   - Rotate JWT secrets regularly
   - Keep API keys in secure storage
   - Enable rate limiting
   - Use Turnstile for public instances

2. **Performance**:
   - Use Redis for multi-instance setups
   - Enable CDN for static assets
   - Configure appropriate rate limits
   - Monitor resource usage

3. **Reliability**:
   - Set up health checks
   - Configure automatic restarts
   - Implement proper logging
   - Regular backups
   - Test updates in staging first

4. **Maintenance**:
   - Schedule regular updates
   - Monitor security advisories
   - Clean up old logs
   - Review rate limit settings
   - Update dependencies regularly
