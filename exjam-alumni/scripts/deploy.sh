#!/bin/bash

# ExJAM Alumni - Vercel Deployment Script
# Usage: ./scripts/deploy.sh [preview|production]

set -e

ENVIRONMENT=${1:-preview}
PROJECT_DIR=$(dirname "$0")/..

echo "🚀 Deploying ExJAM Alumni to Vercel ($ENVIRONMENT)..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Validate environment
echo "🔍 Validating environment..."
npm run validate-env

# Run build locally first to catch issues
echo "🔨 Testing build locally..."
SKIP_ENV_VALIDATION=true npm run build

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌟 Deploying to PRODUCTION..."
    vercel --prod --yes
else
    echo "🔍 Deploying to PREVIEW..."
    vercel --yes
fi

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | head -2 | tail -1 | awk '{print $2}')

echo "✅ Deployment completed!"
echo "🌐 URL: https://$DEPLOYMENT_URL"

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f -s "https://$DEPLOYMENT_URL/api/health" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed - please verify deployment"
fi

echo "📊 View deployment: https://vercel.com/dashboard"
echo "📚 View logs: vercel logs https://$DEPLOYMENT_URL"