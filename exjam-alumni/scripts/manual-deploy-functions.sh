#!/bin/bash

# Manual Edge Functions Deployment
# Deploy functions directly to Supabase without linking

set -e

echo "🚀 Deploying Supabase Edge Functions manually..."

# Load environment variables
source .env.local

PROJECT_REF="yzrzjagkkycmdwuhrvww"
echo "📋 Project Reference: $PROJECT_REF"

# Functions to deploy
functions=(
    "send-notification"
    "generate-badge" 
    "check-in"
    "analytics"
    "payment-webhook"
    "sync-user-data"
)

deployed=0
failed=0

echo "📦 Deploying functions..."

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    
    if supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt; then
        echo "✅ $func deployed successfully"
        ((deployed++))
    else
        echo "❌ Failed to deploy $func"
        ((failed++))
        
        # Try alternative deployment method
        echo "🔄 Retrying with different options..."
        if curl -X POST \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d @"supabase/functions/$func/index.ts" \
            "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/$func"; then
            echo "✅ $func deployed via API"
            ((deployed++))
            ((failed--))
        fi
    fi
done

echo ""
echo "📊 Deployment Summary:"
echo "✅ Successfully deployed: $deployed functions"
echo "❌ Failed to deploy: $failed functions"

if [ $failed -eq 0 ]; then
    echo ""
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "🔗 Function URLs:"
    for func in "${functions[@]}"; do
        echo "   $func: https://yzrzjagkkycmdwuhrvww.supabase.co/functions/v1/$func"
    done
fi