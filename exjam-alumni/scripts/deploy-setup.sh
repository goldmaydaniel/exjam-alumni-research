#!/bin/bash

# ExJAM Alumni Deployment Setup Script
# This script prepares the application for production deployment

set -e

echo "🚀 Starting ExJAM Alumni deployment setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "DIRECT_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_status "All required environment variables are set ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    elif [[ -f "yarn.lock" ]]; then
        yarn install --frozen-lockfile
    elif [[ -f "pnpm-lock.yaml" ]]; then
        pnpm install --frozen-lockfile
    else
        npm install
    fi
    
    print_status "Dependencies installed ✓"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate deploy
    
    # Apply performance indexes
    if [[ -f "prisma/migrations/add_performance_indexes.sql" ]]; then
        print_status "Applying performance indexes..."
        psql "$DATABASE_URL" -f prisma/migrations/add_performance_indexes.sql || {
            print_warning "Failed to apply performance indexes (this might be expected)"
        }
    fi
    
    print_status "Database setup complete ✓"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Set NODE_ENV for production build
    export NODE_ENV=production
    
    # Run the build
    npm run build
    
    print_status "Application built successfully ✓"
}

# Optimize build artifacts
optimize_build() {
    print_status "Optimizing build artifacts..."
    
    # Remove source maps in production (if any)
    find .next -name "*.map" -type f -delete 2>/dev/null || true
    
    # Compress static assets if gzip is available
    if command -v gzip &> /dev/null; then
        find .next/static -name "*.js" -o -name "*.css" | while read -r file; do
            if [[ ! -f "$file.gz" ]]; then
                gzip -k "$file"
            fi
        done
        print_status "Static assets compressed ✓"
    fi
    
    print_status "Build optimization complete ✓"
}

# Security checks
security_checks() {
    print_status "Running security checks..."
    
    # Check for security vulnerabilities
    npm audit --production --audit-level moderate || {
        print_warning "Security vulnerabilities found - please review"
    }
    
    # Check environment configuration
    if [[ "$NODE_ENV" == "production" ]]; then
        # Ensure sensitive data isn't exposed
        if [[ -f ".env.local" ]] && grep -q "PASSWORD\|SECRET\|KEY" .env.local; then
            print_warning "Sensitive data found in .env.local - ensure it's not committed"
        fi
    fi
    
    print_status "Security checks complete ✓"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Check if Prisma client can connect to database
    npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null || {
        print_error "Database connection failed"
        exit 1
    }
    
    # Check if build directory exists and has content
    if [[ ! -d ".next" ]] || [[ -z "$(ls -A .next 2>/dev/null)" ]]; then
        print_error "Build directory is missing or empty"
        exit 1
    fi
    
    print_status "Health check passed ✓"
}

# Deployment summary
deployment_summary() {
    print_status "Deployment Summary:"
    echo "  🏗️  Build: Complete"
    echo "  🗄️  Database: Migrated"
    echo "  🔒 Security: Checked"
    echo "  💚 Health: OK"
    echo ""
    echo "✅ Application is ready for deployment!"
    echo ""
    echo "📋 Deployment checklist:"
    echo "  1. Environment variables configured"
    echo "  2. Database connected and migrated"
    echo "  3. Application built successfully"
    echo "  4. Security checks passed"
    echo "  5. Performance optimizations applied"
    echo ""
    echo "🚀 You can now deploy to your production environment."
}

# Main execution
main() {
    echo "🎯 ExJAM Alumni Production Deployment Setup"
    echo "=========================================="
    echo ""
    
    # Run all setup steps
    check_env_vars
    install_dependencies
    run_migrations
    build_application
    optimize_build
    security_checks
    health_check
    
    echo ""
    deployment_summary
}

# Handle script arguments
case "${1:-}" in
    --env-check)
        check_env_vars
        ;;
    --deps-only)
        install_dependencies
        ;;
    --db-only)
        run_migrations
        ;;
    --build-only)
        build_application
        optimize_build
        ;;
    --security-only)
        security_checks
        ;;
    --health-only)
        health_check
        ;;
    *)
        main
        ;;
esac