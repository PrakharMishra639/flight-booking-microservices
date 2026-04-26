#!/bin/bash

# ============================================
# Smart Airline Booking System - Microservices Startup Script
# ============================================

BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "============================================"
echo "  ✈  AIRLINE BOOKING MICROSERVICES LAUNCHER"
echo "============================================"
echo ""

# Service array: name, directory, port
SERVICES=(
  "pricing-service:4006"
  "user-service:4002"
  "auth-service:4001"
  "flight-service:4003"
  "seat-service:4004"
  "booking-service:4005"
  "notification-service:4007"
  "analytics-service:4008"
  "api-gateway:4000"
)

# Install dependencies for all services
install_deps() {
  echo -e "${YELLOW}📦 Installing dependencies for all services...${NC}"
  for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service_info"
    echo -e "  → Installing ${name}..."
    (cd "$BACKEND_DIR/$name" && npm install --silent 2>/dev/null) &
  done
  wait
  echo -e "${GREEN}✅ All dependencies installed${NC}"
  echo ""
}

# Start all services
start_all() {
  echo -e "${YELLOW}🚀 Starting all services...${NC}"
  for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service_info"
    echo -e "  → Starting ${GREEN}${name}${NC} on port ${port}..."
    (cd "$BACKEND_DIR/$name" && PORT=$port node src/app.js &) 2>/dev/null
    sleep 1
  done
  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  ✅ All services started!${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo -e ""
  echo -e "  📡 API Gateway:       http://localhost:4000"
  echo -e "  🔐 Auth Service:      http://localhost:4001"
  echo -e "  👤 User Service:      http://localhost:4002"
  echo -e "  ✈  Flight Service:    http://localhost:4003"
  echo -e "  💺 Seat Service:      http://localhost:4004"
  echo -e "  🎫 Booking Service:   http://localhost:4005"
  echo -e "  💰 Pricing Service:   http://localhost:4006"
  echo -e "  📧 Notification:      http://localhost:4007"
  echo -e "  📊 Analytics:         http://localhost:4008"
  echo -e ""
  echo -e "  🔌 WebSocket:         ws://localhost:4000/socket.io"
  echo -e "  🏥 Health Check:      http://localhost:4000/health"
  echo -e ""
}

# Stop all services
stop_all() {
  echo -e "${RED}🛑 Stopping all services...${NC}"
  for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service_info"
    lsof -ti:$port | xargs kill -9 2>/dev/null
  done
  echo -e "${GREEN}✅ All services stopped${NC}"
}

# Check health of all services
health_check() {
  echo -e "${YELLOW}🏥 Checking service health...${NC}"
  for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service_info"
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
      echo -e "  ✅ ${GREEN}${name}${NC} (port $port) - UP"
    else
      echo -e "  ❌ ${RED}${name}${NC} (port $port) - DOWN"
    fi
  done
}

case "$1" in
  install)  install_deps ;;
  start)    start_all ;;
  stop)     stop_all ;;
  restart)  stop_all; sleep 2; start_all ;;
  health)   health_check ;;
  *)
    echo "Usage: $0 {install|start|stop|restart|health}"
    echo ""
    echo "  install  - Install npm dependencies for all services"
    echo "  start    - Start all microservices"
    echo "  stop     - Stop all microservices"
    echo "  restart  - Restart all microservices"
    echo "  health   - Check health of all services"
    ;;
esac
