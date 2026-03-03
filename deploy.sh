#!/bin/bash

# Deployment script for Amadeus Flights MCP Standalone Container
# Usage: ./deploy.sh [build|start|stop|restart|logs|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
CONTAINER_NAME="mcp-amadeusflights-prod"
NETWORK_NAME="travel-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_network() {
    if ! docker network ls | grep -q "$NETWORK_NAME"; then
        log_warn "Network $NETWORK_NAME does not exist. Creating it..."
        docker network create "$NETWORK_NAME" || {
            log_error "Failed to create network $NETWORK_NAME"
            exit 1
        }
        log_info "Network $NETWORK_NAME created"
    else
        log_info "Network $NETWORK_NAME exists"
    fi
}

check_env_file() {
    if [ ! -f .env ]; then
        log_warn ".env file not found. Creating from template..."
        if [ -f .env.example ]; then
            cp .env.example .env
            log_warn "Please edit .env file with your Amadeus API credentials"
        else
            log_error ".env file not found and no .env.example template available"
            exit 1
        fi
    fi
}

build() {
    log_info "Building Docker image..."
    check_env_file
    docker-compose -f "$COMPOSE_FILE" build
    log_info "Build completed"
}

start() {
    log_info "Starting Flights MCP container..."
    check_network
    check_env_file
    
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        log_info "Container exists, starting it..."
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        log_info "Creating and starting new container..."
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    log_info "Waiting for container to be healthy..."
    sleep 5
    
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log_info "Container started successfully"
        status
    else
        log_error "Container failed to start"
        docker logs "$CONTAINER_NAME" --tail=50
        exit 1
    fi
}

stop() {
    log_info "Stopping Flights MCP container..."
    docker-compose -f "$COMPOSE_FILE" down
    log_info "Container stopped"
}

restart() {
    log_info "Restarting Flights MCP container..."
    stop
    sleep 2
    start
}

logs() {
    log_info "Showing logs for $CONTAINER_NAME..."
    docker logs "$CONTAINER_NAME" --tail=100 -f
}

status() {
    log_info "Container status:"
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo ""
        docker ps | grep "$CONTAINER_NAME"
        echo ""
        log_info "Health check:"
        docker inspect "$CONTAINER_NAME" --format='{{.State.Health.Status}}' || echo "No health check configured"
        echo ""
        log_info "Network connections:"
        docker inspect "$CONTAINER_NAME" --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'
        echo ""
    else
        log_warn "Container is not running"
        if docker ps -a | grep -q "$CONTAINER_NAME"; then
            log_info "Container exists but is stopped"
            docker ps -a | grep "$CONTAINER_NAME"
        else
            log_warn "Container does not exist"
        fi
    fi
}

test_health() {
    log_info "Testing health endpoint..."
    if docker ps | grep -q "$CONTAINER_NAME"; then
        response=$(docker exec "$CONTAINER_NAME" node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" 2>&1)
        if [ $? -eq 0 ]; then
            log_info "Health check passed"
        else
            log_error "Health check failed"
            exit 1
        fi
    else
        log_error "Container is not running"
        exit 1
    fi
}

case "${1:-}" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    test)
        test_health
        ;;
    *)
        echo "Usage: $0 {build|start|stop|restart|logs|status|test}"
        echo ""
        echo "Commands:"
        echo "  build   - Build the Docker image"
        echo "  start   - Start the container"
        echo "  stop    - Stop the container"
        echo "  restart - Restart the container"
        echo "  logs    - Show container logs (follow mode)"
        echo "  status  - Show container status"
        echo "  test    - Test health endpoint"
        exit 1
        ;;
esac

