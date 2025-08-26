#!/bin/bash

# Setup script for EXJAM membership database
echo "🏗️  Setting up EXJAM membership database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL and run this script again"
    echo "Example: export DATABASE_URL='your_postgres_connection_string'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql is not installed or not in PATH"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "📋 Running membership system migration..."

# Run the migration
psql "$DATABASE_URL" -f supabase/migrations/20250125_membership_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Membership database setup completed successfully!"
    echo ""
    echo "📊 Summary of created components:"
    echo "   • User profiles table (basic and alumni users)"
    echo "   • Alumni profiles table (AFMS-specific data)"
    echo "   • Membership tiers (Annual/Lifetime/Student)"
    echo "   • User memberships tracking"
    echo "   • Payment processing tables"
    echo "   • Alumni connections system"
    echo "   • Activity logging"
    echo "   • Row Level Security policies"
    echo "   • Alumni directory view"
    echo ""
    echo "🔗 Available endpoints:"
    echo "   • POST /api/auth/register/enhanced (basic & membership signup)"
    echo "   • GET  /api/membership/tiers (membership options)"
    echo "   • POST /api/membership/create (process membership)"
    echo "   • GET  /api/alumni (alumni directory with memberships)"
    echo ""
    echo "🎯 You can now:"
    echo "   • Register basic users at /signup"
    echo "   • Register alumni members at /membership/register"
    echo "   • View the alumni directory at /alumni"
    echo "   • Browse membership options at /membership"
else
    echo "❌ Migration failed. Please check the error messages above."
    echo "💡 Common issues:"
    echo "   • Database connection refused"
    echo "   • Insufficient permissions"
    echo "   • Tables already exist (try dropping them first)"
    exit 1
fi