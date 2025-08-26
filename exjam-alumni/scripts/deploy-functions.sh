#!/bin/bash

# Deploy Supabase Edge Functions
# This script deploys all edge functions to your Supabase project

set -e

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ supabase/config.toml not found. Please run this script from the project root."
    exit 1
fi

# Set up environment variables for functions
echo "📋 Setting up environment variables..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with required environment variables."
    exit 1
fi

# Load environment variables
source .env.local

# Set secrets for edge functions (these will be available in Deno.env.get())
echo "🔐 Setting up function secrets..."

# Note: In production, you would set these secrets via Supabase dashboard or CLI
# supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"
# supabase secrets set PAYSTACK_SECRET_KEY="$PAYSTACK_SECRET_KEY"
# supabase secrets set SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
# supabase secrets set SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
# supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "⚠️  Remember to set the following secrets in your Supabase project:"
echo "   - RESEND_API_KEY"
echo "   - PAYSTACK_SECRET_KEY" 
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

# Deploy functions
echo "📦 Deploying functions..."

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

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    if supabase functions deploy "$func" --project-ref "${NEXT_PUBLIC_SUPABASE_URL##*/}" 2>/dev/null; then
        echo "✅ $func deployed successfully"
        ((deployed++))
    else
        echo "❌ Failed to deploy $func"
        ((failed++))
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
    echo "📝 Next steps:"
    echo "1. Set up the required secrets in your Supabase project dashboard"
    echo "2. Test the functions using: npm run test:functions"
    echo "3. Update your frontend to use the new edge function URLs"
    echo ""
    echo "🔗 Function URLs:"
    for func in "${functions[@]}"; do
        echo "   $func: ${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/$func"
    done
else
    echo ""
    echo "⚠️  Some functions failed to deploy. Please check the errors above."
    exit 1
fi