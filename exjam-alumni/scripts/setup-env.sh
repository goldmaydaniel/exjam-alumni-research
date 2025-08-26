#!/bin/bash

# ExJAM Alumni - Environment Setup for Vercel
# Usage: ./scripts/setup-env.sh

set -e

echo "🔧 Setting up environment variables for Vercel deployment..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local based on .env.example"
    exit 1
fi

echo "📋 Available environments:"
echo "1. production"
echo "2. preview"
echo "3. development"
read -p "Select environment (1-3): " env_choice

case $env_choice in
    1) ENVIRONMENT="production" ;;
    2) ENVIRONMENT="preview" ;;
    3) ENVIRONMENT="development" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

echo "🔐 Setting up environment variables for: $ENVIRONMENT"

# Essential variables
declare -A ENV_VARS
ENV_VARS[NEXT_PUBLIC_SUPABASE_URL]="Your Supabase project URL"
ENV_VARS[NEXT_PUBLIC_SUPABASE_ANON_KEY]="Your Supabase anon key"
ENV_VARS[SUPABASE_SERVICE_ROLE_KEY]="Your Supabase service role key"
ENV_VARS[DATABASE_URL]="Your database connection string"
ENV_VARS[DIRECT_URL]="Your direct database connection string"
ENV_VARS[JWT_SECRET]="Your JWT secret key"
ENV_VARS[RESEND_API_KEY]="Your Resend API key"
ENV_VARS[PAYSTACK_SECRET_KEY]="Your Paystack secret key"
ENV_VARS[NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY]="Your Paystack public key"
ENV_VARS[CRON_SECRET]="Secret for cron job authentication"

# Interactive setup
for var_name in "${!ENV_VARS[@]}"; do
    description=${ENV_VARS[$var_name]}
    
    # Check if variable exists in .env.local
    if grep -q "^$var_name=" .env.local; then
        current_value=$(grep "^$var_name=" .env.local | cut -d'=' -f2- | tr -d '"')
        echo "🔍 Found $var_name in .env.local"
        read -p "Use existing value? (y/n): " use_existing
        
        if [ "$use_existing" = "y" ] || [ "$use_existing" = "Y" ]; then
            vercel env add "$var_name" "$ENVIRONMENT" < <(echo "$current_value")
            echo "✅ Set $var_name"
        else
            read -p "Enter $description: " new_value
            vercel env add "$var_name" "$ENVIRONMENT" < <(echo "$new_value")
            echo "✅ Set $var_name"
        fi
    else
        read -p "Enter $description: " new_value
        vercel env add "$var_name" "$ENVIRONMENT" < <(echo "$new_value")
        echo "✅ Set $var_name"
    fi
done

# Optional variables
echo "🎯 Setting optional variables..."

# Organization details
ORG_VARS=(
    "NEXT_PUBLIC_ORG_NAME:Organization name"
    "NEXT_PUBLIC_ORG_EMAIL:Organization email"
    "NEXT_PUBLIC_ORG_PHONE:Organization phone"
    "NEXT_PUBLIC_BANK_NAME:Bank name"
    "NEXT_PUBLIC_ACCOUNT_NAME:Account name"
    "NEXT_PUBLIC_ACCOUNT_NUMBER:Account number"
)

for var_info in "${ORG_VARS[@]}"; do
    var_name=$(echo "$var_info" | cut -d':' -f1)
    description=$(echo "$var_info" | cut -d':' -f2)
    
    if grep -q "^$var_name=" .env.local; then
        current_value=$(grep "^$var_name=" .env.local | cut -d'=' -f2- | tr -d '"')
        vercel env add "$var_name" "$ENVIRONMENT" < <(echo "$current_value")
        echo "✅ Set $var_name"
    fi
done

# Application URLs
if [ "$ENVIRONMENT" = "production" ]; then
    read -p "Enter production domain (e.g., exjam-alumni.vercel.app): " prod_domain
    vercel env add "NEXT_PUBLIC_URL" "$ENVIRONMENT" < <(echo "https://$prod_domain")
    vercel env add "NEXT_PUBLIC_APP_URL" "$ENVIRONMENT" < <(echo "https://$prod_domain")
else
    echo "ℹ️  Preview URLs will be set automatically by Vercel"
fi

echo "✅ Environment setup completed for $ENVIRONMENT!"
echo "🚀 You can now deploy with: vercel --prod (for production) or vercel (for preview)"
echo "📋 View all env vars: vercel env ls"