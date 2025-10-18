#!/bin/bash

# Production Health Check Script
set -e

echo "🔍 Checking production services health..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.production

echo -e "${YELLOW}📋 Production Services Status:${NC}"
docker-compose --env-file .env.production ps

echo -e "\n${YELLOW}🔍 Health Checks:${NC}"

# Check database health
echo -n "Database: "
if docker-compose --env-file .env.production exec -T db pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-app} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Check application health
echo -n "Application: "
if curl -f http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Check Docker containers
echo -e "\n${YELLOW}🐳 Container Status:${NC}"
APP_STATUS=$(docker inspect nest_basic_prisma_app --format='{{.State.Status}}' 2>/dev/null || echo "not found")
DB_STATUS=$(docker inspect nest_basic_prisma_pg --format='{{.State.Status}}' 2>/dev/null || echo "not found")

echo "App Container: $APP_STATUS"
echo "DB Container: $DB_STATUS"

# Check disk usage
echo -e "\n${YELLOW}💾 Disk Usage:${NC}"
docker system df

# Check resource usage
echo -e "\n${YELLOW}📊 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo -e "\n${GREEN}🎉 Health check complete!${NC}"
