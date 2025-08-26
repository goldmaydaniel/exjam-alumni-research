#!/bin/bash

# ExJAM Alumni - Vercel Environment Variables Setup
# This script sets up all environment variables from .env.local to Vercel production

set -e

echo "🔧 Setting up Vercel environment variables for production..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    
    echo "🔐 Setting $var_name..."
    echo "$var_value" | vercel env add "$var_name" production
    echo "✅ Set $var_name"
}

# Essential Supabase variables
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTc2MzksImV4cCI6MjA3MTQ5MzYzOX0.p_S5zIZHE9fBDL4ZiP-NZd8vDKIyHvfxje4WqaE-KoA"

add_env_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ"

# Database variables
add_env_var "DATABASE_URL" "postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres"

add_env_var "DIRECT_URL" "postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres"

# JWT Configuration
add_env_var "JWT_SECRET" "exjam-alumni-super-secret-jwt-key-2025-production-ready-secure-token"

# Email Configuration
add_env_var "RESEND_API_KEY" "re_iL2VeusW_9bnfECzUTDvGziwRqYFmAzkg"

add_env_var "RESEND_FROM_EMAIL" "onboarding@resend.dev"

# Payment Gateway
add_env_var "PAYSTACK_SECRET_KEY" "sk_test_eb74eed370c595cef1eefeae04c2777992108707"

add_env_var "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY" "pk_test_eb74eed370c595cef1eefeae04c2777992108707"

# Organization Details
add_env_var "NEXT_PUBLIC_ORG_NAME" "ExJAM Alumni Association"

add_env_var "NEXT_PUBLIC_ORG_EMAIL" "payments@exjamalumni.org"

add_env_var "NEXT_PUBLIC_ORG_PHONE" "+234 801 234 5678"

# Banking Details
add_env_var "NEXT_PUBLIC_BANK_NAME" "First Bank of Nigeria"

add_env_var "NEXT_PUBLIC_ACCOUNT_NAME" "ExJAM Alumni Association"

add_env_var "NEXT_PUBLIC_ACCOUNT_NUMBER" "3123456789"

# Application URLs (will be updated after deployment)
add_env_var "NEXT_PUBLIC_URL" "https://exjam-alumni.vercel.app"

add_env_var "NEXT_PUBLIC_APP_URL" "https://exjam-alumni.vercel.app"

# Cron job secret
add_env_var "CRON_SECRET" "exjam-cron-secret-2025"

echo "✅ All environment variables have been set up for production!"
echo "🚀 You can now deploy with: vercel --prod"
echo "📋 View all env vars: vercel env ls"
