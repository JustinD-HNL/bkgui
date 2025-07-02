#!/bin/bash

# Buildkite Pipeline Builder - Google Cloud Run Deployment Script
# This script deploys the application to Google Cloud Run (No Authentication)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (modify these values)
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="buildkite-pipeline-builder"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}🚀 Buildkite Pipeline Builder - Cloud Run Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}✅ Authentication disabled - no Firebase configuration needed${NC}"
echo ""

# Prompt for project configuration
read -p "Enter your Google Cloud Project ID [${PROJECT_ID}]: " INPUT_PROJECT_ID
if [[ ! -z "$INPUT_PROJECT_ID" ]]; then
    PROJECT_ID=$INPUT_PROJECT_ID
    IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
fi

echo -e "${GREEN}✅ Using Project ID: ${PROJECT_ID}${NC}"
echo ""

# Check if required tools are installed
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}❌ gcloud CLI is required but not installed. Please install it first.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed. Please install it first.${NC}" >&2; exit 1; }

# Check if user is logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
    echo -e "${YELLOW}⚠️  You need to authenticate with Google Cloud first${NC}"
    echo -e "${BLUE}Running: gcloud auth login${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${BLUE}📋 Setting project to: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t $IMAGE_NAME .

# Push the image to Google Container Registry
echo -e "${BLUE}📤 Pushing image to Google Container Registry...${NC}"
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 100 \
    --max-instances 10 \
    --port 8080 \
    --set-env-vars "NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌍 Your application is now live at: ${SERVICE_URL}${NC}"
echo -e "${GREEN}🔓 Authentication: Disabled (no sign-in required)${NC}"
echo -e "${BLUE}📊 To view logs: gcloud logs tail --service=${SERVICE_NAME}${NC}"
echo -e "${BLUE}🔍 To view in console: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}${NC}"

# Optional: Open the application in browser
read -p "Do you want to open the application in your browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open $SERVICE_URL
fi

echo -e "${GREEN}🎉 Deployment complete! Your Buildkite Pipeline Builder is ready to use.${NC}"