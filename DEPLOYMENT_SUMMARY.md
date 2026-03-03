# Flights MCP Standalone Deployment - Quick Reference

## Overview

Deploy the Amadeus Flights MCP server as a standalone container on the same EC2 instance, accessible at `travel.unisco.com/flights/mcp`.

## Quick Start

### 1. Setup Environment
```bash
cd /path/to/mcp-amadeusflights
cp .env.example .env
# Edit .env with your Amadeus API credentials
```

### 2. Deploy
```bash
# Make deploy script executable
chmod +x deploy.sh

# Build and start
./deploy.sh build
./deploy.sh start

# Or use docker-compose directly
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Verify
```bash
# Check status
./deploy.sh status

# Test health
./deploy.sh test

# View logs
./deploy.sh logs
```

### 4. Update Nginx (if not already done)
```bash
cd /path/to/travel-platform-deployment
docker exec travel-nginx-prod nginx -t
docker exec travel-nginx-prod nginx -s reload
```

## Key Files

- `docker-compose.prod.yml` - Production Docker Compose configuration
- `.env` - Environment variables (Amadeus credentials)
- `deploy.sh` - Deployment automation script
- `DEPLOYMENT.md` - Full deployment guide

## Container Details

- **Container Name**: `mcp-amadeusflights-prod`
- **Internal Port**: `3000`
- **External Access**: `127.0.0.1:3000` (localhost only, via nginx)
- **Network**: `travel-network` (shared with travel-platform-deployment)
- **Health Endpoint**: `http://localhost:3000/health`
- **MCP Endpoint**: `http://localhost:3000/mcp`

## Nginx Configuration

The nginx upstream in `travel-platform-deployment/nginx/nginx.conf` points to:
```
upstream mcp_flights {
    server mcp-amadeusflights-prod:3000;
    keepalive 16;
}
```

## Access URLs

- **Production (via nginx)**: `https://travel.unisco.com/flights/mcp`
- **Direct (localhost only)**: `http://localhost:3000/mcp`
- **Health Check**: `http://localhost:3000/health`

## Common Commands

```bash
# Start
./deploy.sh start

# Stop
./deploy.sh stop

# Restart
./deploy.sh restart

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Test health
./deploy.sh test
```

## Troubleshooting

### Container not starting
```bash
docker logs mcp-amadeusflights-prod
```

### Network issues
```bash
# Check network exists
docker network ls | grep travel-network

# Check container is on network
docker inspect mcp-amadeusflights-prod | grep -A 10 "Networks"
```

### Nginx can't reach container
```bash
# Test from nginx container
docker exec travel-nginx-prod ping mcp-amadeusflights-prod
```

## Next Steps

1. Remove the old `mcp-flight-search` service from `travel-platform-deployment/docker-compose.prod.yml` (optional)
2. Update any monitoring/alerting to use the new container name
3. Test the MCP connection with n8n or MCP Inspector

