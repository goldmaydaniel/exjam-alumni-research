#!/bin/bash

echo "🚀 ExJAM Alumni Database Setup Script"
echo "======================================"
echo ""

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo ""
    echo "Please set up your database first:"
    echo "1. Go to Vercel Dashboard → Storage → Create Database"
    echo "2. Choose Postgres (recommended)"
    echo "3. Add DATABASE_URL to environment variables"
    echo "4. Run: vercel env pull"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Check if we can connect to database
echo "🔌 Testing database connection..."
npx prisma db pull --print

if [ $? -ne 0 ]; then
    echo "❌ Could not connect to database"
    echo "Please check your DATABASE_URL"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Migrations may have already been applied or failed"
    echo "Attempting to continue..."
fi

# Create admin user
echo ""
echo "👤 Creating admin user..."
npm run create-admin

echo ""
echo "======================================"
echo "✅ Database setup complete!"
echo ""
echo "Admin credentials:"
echo "Email: admin@exjamalumni.org"
echo "Password: Admin@2025!"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
echo "Next steps:"
echo "1. Login at: /login"
echo "2. Access admin dashboard: /admin"
echo "3. Deploy your changes: vercel --prod"