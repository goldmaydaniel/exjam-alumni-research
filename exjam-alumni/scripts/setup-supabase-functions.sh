#!/bin/bash

# Setup Supabase Edge Functions
# This script handles the complete setup process for Edge Functions

set -e

echo "🚀 Setting up Supabase Edge Functions..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

source .env.local

# Extract project ref from Supabase URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local${NC}"
    exit 1
fi

PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')
echo -e "${BLUE}📋 Project Reference: ${PROJECT_REF}${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    npm install -g supabase
fi

echo -e "${GREEN}✅ Supabase CLI version: $(supabase --version)${NC}"

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Supabase not initialized. Running supabase init...${NC}"
    supabase init
fi

# Create a simple project linking approach
echo -e "${BLUE}🔗 Setting up project configuration...${NC}"

# Create or update the project config
cat > supabase/.temp << EOF
linked_project = "$PROJECT_REF"
EOF

# Check if functions directory exists and has functions
if [ ! -d "supabase/functions" ] || [ -z "$(ls -A supabase/functions 2>/dev/null)" ]; then
    echo -e "${RED}❌ No functions found in supabase/functions directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found $(ls supabase/functions | wc -l) function directories${NC}"

# List available functions
echo -e "${BLUE}📦 Available functions:${NC}"
for func in supabase/functions/*/; do
    if [ -d "$func" ] && [ ! "$(basename "$func")" = "_shared" ]; then
        func_name=$(basename "$func")
        echo "   - $func_name"
    fi
done

# Validate function structure
echo -e "${BLUE}🔍 Validating function structure...${NC}"
validation_errors=0

for func in supabase/functions/*/; do
    if [ -d "$func" ] && [ ! "$(basename "$func")" = "_shared" ]; then
        func_name=$(basename "$func")
        if [ ! -f "$func/index.ts" ]; then
            echo -e "${RED}❌ Missing index.ts in $func_name${NC}"
            validation_errors=$((validation_errors + 1))
        else
            echo -e "${GREEN}✅ $func_name structure valid${NC}"
        fi
    fi
done

if [ $validation_errors -gt 0 ]; then
    echo -e "${RED}❌ Function validation failed with $validation_errors errors${NC}"
    exit 1
fi

# Check shared utilities
if [ -d "supabase/functions/_shared" ]; then
    echo -e "${GREEN}✅ Shared utilities found${NC}"
    ls supabase/functions/_shared/
else
    echo -e "${RED}❌ Shared utilities directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Supabase Edge Functions setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Deploy functions: npm run functions:deploy"
echo "2. Test functions: npm run functions:test"
echo "3. Set up secrets in Supabase dashboard"
echo ""
echo -e "${BLUE}Required secrets to set in Supabase:${NC}"
echo "   - RESEND_API_KEY"
echo "   - PAYSTACK_SECRET_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"  
echo "   - SUPABASE_SERVICE_ROLE_KEY"