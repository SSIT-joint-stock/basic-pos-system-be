#!/bin/bash

# Docker Production Build Script
set -e

echo "🐳 Building Docker image for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Build with no cache option
BUILD_NO_CACHE=${1:-false}

if [ "$BUILD_NO_CACHE" = "true" ] || [ "$BUILD_NO_CACHE" = "--no-cache" ]; then
    echo -e "${YELLOW}🔨 Building with no cache...${NC}"
    docker build --no-cache -t pos-system:latest .
else
    echo -e "${YELLOW}🔨 Building with cache...${NC}"
    docker build -t pos-system:latest .
fi

# Verify the image was built successfully
if docker images | grep "pos-system" | grep "latest" > /dev/null; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    
    # Show image size
    IMAGE_SIZE=$(docker images pos-system:latest --format "{{.Size}}")
    echo -e "${GREEN}📦 Image size: ${IMAGE_SIZE}${NC}"
    
    # Show image details
    echo -e "${YELLOW}📋 Image details:${NC}"
    docker images pos-system:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Docker build completed successfully!${NC}"
echo -e "${GREEN}💡 Run 'make deploy-prod' to deploy to production${NC}"
