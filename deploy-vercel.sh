#!/bin/bash

# ExJAM Alumni Registration - Vercel Deployment Script

echo "🚀 Starting ExJAM Alumni Registration Deployment to Vercel"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        echo "Please install manually: npm install -g vercel"
        exit 1
    fi
    echo "✅ Vercel CLI installed successfully"
else
    echo "✅ Vercel CLI is already installed"
fi

# Check if user is logged in to Vercel
echo ""
echo "🔐 Checking Vercel authentication..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "📝 You need to log in to Vercel"
    echo "Please follow the prompts to authenticate:"
    vercel login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to authenticate with Vercel"
        exit 1
    fi
fi

echo "✅ Authenticated with Vercel"
echo ""

# Deploy options
echo "📦 Deployment Options:"
echo "====================="
echo "1. Deploy to Preview (recommended for testing)"
echo "2. Deploy to Production"
echo ""
read -p "Choose deployment type (1 or 2): " deploy_choice

case $deploy_choice in
    1)
        echo ""
        echo "🔧 Deploying to Preview environment..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Production environment..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and select 1 or 2."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "🎉 Deployment Successful!"
    echo ""
    echo "📌 Your ExJAM Alumni Registration page is now live!"
    echo ""
    echo "Next Steps:"
    echo "-----------"
    echo "1. Visit your deployment URL (shown above)"
    echo "2. Test the registration form"
    echo "3. Share the URL with your team"
    echo ""
    echo "🔧 Useful Commands:"
    echo "-------------------"
    echo "• View deployments:     vercel list"
    echo "• View logs:           vercel logs"
    echo "• Set custom domain:   vercel domains add [domain]"
    echo "• Environment vars:    vercel env"
    echo ""
    echo "📚 Documentation: https://vercel.com/docs"
    echo "=================================================="
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    echo "If you need help, visit: https://vercel.com/docs"
    exit 1
fi