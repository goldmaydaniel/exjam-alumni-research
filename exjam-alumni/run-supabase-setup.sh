#!/bin/bash

echo "🚀 Setting up Supabase for PG Conference 2025..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Run the SQL setup
echo "📝 Running SQL setup script..."
supabase db execute --file setup-supabase-pg-conference.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Supabase setup completed successfully!"
    echo ""
    echo "📋 What was created:"
    echo "   • Storage bucket: event-photos (10MB limit)"
    echo "   • Event record: pg-conference-2025"
    echo "   • Table: PGConferenceRegistration"
    echo "   • Table: EventPaymentDetails"
    echo "   • View: PGConferenceRegistrationView"
    echo "   • RLS policies and triggers"
    echo ""
    echo "🎯 Your registration system is now ready!"
else
    echo ""
    echo "❌ Setup failed. Please check the error messages above."
    echo "   Make sure you're connected to your Supabase project."
fi