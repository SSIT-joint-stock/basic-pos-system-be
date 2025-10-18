#!/bin/bash

# Build and Deploy Script for Production
set -e

echo "🚀 Building and deploying POS System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo "Creating from .env.example..."
    cp .env.example .env.production
    echo -e "${YELLOW}⚠️  Please update .env.production with production values${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t pos-system:latest .

echo -e "${YELLOW}🧪 Running security scan...${NC}"
# Optional: Run security scan
# docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
#   -v $PWD:/src anchore/grype pos-system:latest

echo -e "${YELLOW}🚀 Starting production services...${NC}"
docker-compose -f docker-compose.yml --env-file .env.production up -d

echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check if app is healthy
echo -e "${YELLOW}🔍 Checking application health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Application failed to start${NC}"
        docker-compose -f docker-compose.prod.yml logs app
        exit 1
    fi
    echo "Waiting for app to be ready... ($i/30)"
    sleep 2
done

# Run database migrations if needed
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker-compose -f docker-compose.yml --env-file .env.production exec app npm run db:push:prod

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📝 Application is running at: http://localhost:3002${NC}"
echo -e "${GREEN}📊 Health check: http://localhost:3002/health${NC}"

# Show running containers
echo -e "${YELLOW}📋 Running containers:${NC}"
docker-compose -f docker-compose.yml ps
