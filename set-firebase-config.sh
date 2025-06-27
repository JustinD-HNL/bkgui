#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="buildkite-pipeline-builder"

echo -e "${BLUE}🔧 Firebase Configuration Setup for Cloud Run${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""
echo -e "${YELLOW}This script will update your existing Cloud Run service with Firebase environment variables.${NC}"
echo -e "${YELLOW}You can find your Firebase config at: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general/${NC}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo -e "${RED}❌ You are not logged into gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No default project set. Please run 'gcloud config set project YOUR_PROJECT_ID' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using project: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ Service: $SERVICE_NAME${NC}"
echo ""

# Show available services for reference
echo -e "${BLUE}📋 Available Cloud Run services:${NC}"
gcloud run services list
echo ""

# Prompt for region
read -p "Enter the region for your service (e.g., us-west1): " REGION

if [ -z "$REGION" ]; then
    echo -e "${RED}❌ Region is required.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using region: $REGION${NC}"
echo ""

# Prompt for Firebase configuration
echo -e "${BLUE}📋 Please enter your Firebase configuration values:${NC}"
echo ""

read -p "Enter your Firebase API Key: " FIREBASE_API_KEY
read -p "Enter your Firebase Auth Domain (e.g., your-project.firebaseapp.com): " FIREBASE_AUTH_DOMAIN
read -p "Enter your Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Enter your Firebase Storage Bucket (e.g., your-project.appspot.com): " FIREBASE_STORAGE_BUCKET
read -p "Enter your Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "Enter your Firebase App ID: " FIREBASE_APP_ID

# Validate required fields
if [[ -z "$FIREBASE_API_KEY" || -z "$FIREBASE_AUTH_DOMAIN" || -z "$FIREBASE_PROJECT_ID" ]]; then
    echo -e "${RED}❌ Firebase API Key, Auth Domain, and Project ID are required.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Configuration Summary:${NC}"
echo -e "API Key: ${FIREBASE_API_KEY:0:10}...${FIREBASE_API_KEY: -4}"
echo -e "Auth Domain: $FIREBASE_AUTH_DOMAIN"
echo -e "Project ID: $FIREBASE_PROJECT_ID"
echo -e "Storage Bucket: $FIREBASE_STORAGE_BUCKET"
echo -e "Sender ID: $FIREBASE_MESSAGING_SENDER_ID"
echo -e "App ID: ${FIREBASE_APP_ID:0:15}...${FIREBASE_APP_ID: -8}"
echo ""

read -p "Do you want to proceed with updating the service? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Updating Cloud Run service with Firebase configuration...${NC}"

# Update the service with environment variables
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --update-env-vars NODE_ENV=production \
    --update-env-vars FIREBASE_API_KEY="$FIREBASE_API_KEY" \
    --update-env-vars FIREBASE_AUTH_DOMAIN="$FIREBASE_AUTH_DOMAIN" \
    --update-env-vars FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
    --update-env-vars FIREBASE_STORAGE_BUCKET="$FIREBASE_STORAGE_BUCKET" \
    --update-env-vars FIREBASE_MESSAGING_SENDER_ID="$FIREBASE_MESSAGING_SENDER_ID" \
    --update-env-vars FIREBASE_APP_ID="$FIREBASE_APP_ID" \
    --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully updated Cloud Run service with Firebase configuration!${NC}"
    echo ""
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='get(status.url)')
    
    echo -e "${GREEN}🌐 Your app is now available at: $SERVICE_URL${NC}"
    echo ""
    echo -e "${BLUE}🔧 Next steps:${NC}"
    echo -e "1. Open your Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/authentication/settings"
    echo -e "2. Add your Cloud Run domain to Authorized domains:"
    echo -e "   ${SERVICE_URL#https://}"
    echo -e "3. Test your authentication by visiting: $SERVICE_URL"
    echo -e "4. Debug authentication issues: $SERVICE_URL/debug-auth.html"
    echo ""
    echo -e "${GREEN}🎉 Firebase Authentication is now configured!${NC}"
else
    echo -e "${RED}❌ Failed to update Cloud Run service. Please check the error above.${NC}"
    exit 1
fi
