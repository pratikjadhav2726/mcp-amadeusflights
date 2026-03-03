# Flights MCP Standalone Deployment Guide

This guide explains how to deploy the Amadeus Flights MCP server as a standalone container on the same EC2 instance as the travel-platform-deployment, accessible at `travel.unisco.com/flights/mcp`.

## Prerequisites

1. **EC2 Instance** with Docker and Docker Compose installed
2. **Travel Platform Network** - The `travel-network` Docker network must exist (created by travel-platform-deployment)
3. **Environment Variables** - Amadeus API credentials configured
4. **Nginx** - Already configured in travel-platform-deployment to proxy `/flights/mcp`

## Architecture

```
┌─────────────────────────────────────────────────┐
│  EC2 Instance                                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  travel-platform-deployment               │  │
│  │  (docker-compose.prod.yml)                │  │
│  │  - nginx (reverse proxy)                  │  │
│  │  - travel-api                             │  │
│  │  - travel-app                             │  │
│  │  - mysql                                  │  │
│  │  - mcp-hotel-search                       │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  mcp-amadeusflights                       │  │
│  │  (docker-compose.prod.yml)                 │  │
│  │  - mcp-amadeusflights-prod:3000           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Both on: travel-network (Docker network)      │
└─────────────────────────────────────────────────┘
                          │
                          ▼
              travel.unisco.com/flights/mcp
```

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env` file in the `mcp-amadeusflights` directory:

```bash
cd /path/to/mcp-amadeusflights
nano .env
```

Add the following variables:

```env
# Amadeus API Credentials
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
AMADEUS_ENVIRONMENT=test  # or 'production' for live

# Server Configuration
MCP_SERVER_VERSION=1.1.0
LOG_LEVEL=info
CORS_ORIGIN=*
```

### 2. Ensure Travel Network Exists

The `travel-network` must be created by the travel-platform-deployment. If it doesn't exist:

```bash
docker network create travel-network
```

Or start the travel-platform-deployment first:

```bash
cd /path/to/travel-platform-deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Build and Start the Flights MCP Container

```bash
cd /path/to/mcp-amadeusflights

# Build the image
docker-compose -f docker-compose.prod.yml build

# Start the container
docker-compose -f docker-compose.prod.yml up -d

# Verify it's running
docker ps | grep mcp-amadeusflights
docker logs mcp-amadeusflights-prod
```

### 4. Verify Nginx Configuration

The nginx configuration in `travel-platform-deployment/nginx/nginx.conf` should already be updated to point to `mcp-amadeusflights-prod:3000`.

Verify the upstream configuration:

```bash
cd /path/to/travel-platform-deployment
docker exec travel-nginx-prod cat /etc/nginx/conf.d/default.conf | grep -A 2 "upstream mcp_flights"
```

Should show:
```
upstream mcp_flights {
    server mcp-amadeusflights-prod:3000;
    keepalive 16;
}
```

### 5. Reload Nginx

```bash
docker exec travel-nginx-prod nginx -t
docker exec travel-nginx-prod nginx -s reload
```

### 6. Test the Deployment

#### Test Health Endpoint (Direct)
```bash
curl http://localhost:3000/health
```

#### Test Through Nginx
```bash
curl https://travel.unisco.com/flights/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1"}
    },
    "id": 0
  }' \
  -v
```

Check for the `Mcp-Session-Id` header in the response.

## Maintenance

### View Logs
```bash
docker logs mcp-amadeusflights-prod
docker logs mcp-amadeusflights-prod --tail=50 -f
```

### Restart Container
```bash
cd /path/to/mcp-amadeusflights
docker-compose -f docker-compose.prod.yml restart
```

### Update and Redeploy
```bash
cd /path/to/mcp-amadeusflights

# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Stop Container
```bash
cd /path/to/mcp-amadeusflights
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Container Can't Connect to Network
```bash
# Check if network exists
docker network ls | grep travel-network

# If not, create it
docker network create travel-network

# Connect existing container to network
docker network connect travel-network mcp-amadeusflights-prod
```

### Nginx Can't Reach Container
```bash
# Test connectivity from nginx container
docker exec travel-nginx-prod ping mcp-amadeusflights-prod

# Check if container is on the network
docker inspect mcp-amadeusflights-prod | grep -A 10 "Networks"
```

### Port Conflicts
If port 3000 is already in use:
1. Change the port in `docker-compose.prod.yml`:
   ```yaml
   ports:
     - "127.0.0.1:3001:3000"  # Use 3001 externally
   ```
2. Update nginx upstream to use the new port (if needed)

### Health Check Failing
```bash
# Check container logs
docker logs mcp-amadeusflights-prod

# Test health endpoint manually
docker exec mcp-amadeusflights-prod node -e "require('http').get('http://localhost:3000/health', (res) => { console.log('Status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1) })"
```

## Security Notes

1. **Port Binding**: The container only exposes port 3000 to localhost (`127.0.0.1:3000`), so it's only accessible through nginx
2. **Network Isolation**: Container is on the `travel-network`, isolated from other Docker networks
3. **Environment Variables**: Sensitive credentials are in `.env` file (not committed to git)
4. **Non-root User**: Container runs as non-root user `mcp` for security

## Integration with n8n

The MCP server is accessible at:
- **Production**: `https://travel.unisco.com/flights/mcp`
- **Direct (localhost only)**: `http://localhost:3000/mcp`

Configure n8n MCP client with:
- **URL**: `https://travel.unisco.com/flights/mcp`
- **Transport**: HTTP (streamable)
- **No authentication required** (unless configured)

