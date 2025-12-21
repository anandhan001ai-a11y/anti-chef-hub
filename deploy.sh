#!/bin/bash

echo "🚀 ChefAnand Hub - Deployment Script"
echo "======================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Next Steps:"
echo "1. Add your custom domain in Vercel dashboard"
echo "2. Configure DNS records for chefanandhub.com"
echo "3. Deploy the backend server to Railway"
echo "4. Update environment variables"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
