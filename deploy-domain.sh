#!/bin/bash

# Script to deploy the calculator app with new domain
echo "🚀 Starting deployment for mosabri.top..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Vercel (if using Vercel)
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
else
    echo "⚠️  Vercel CLI not found. Please deploy manually:"
    echo "   - For Vercel: vercel --prod"
    echo "   - For Netlify: netlify deploy --prod"
    echo "   - For other platforms: follow their deployment guide"
fi

echo "🎉 Deployment script completed!"
echo "📋 Next steps:"
echo "   1. Configure DNS records for mosabri.top"
echo "   2. Add custom domain in your hosting platform"
echo "   3. Enable SSL certificate"
echo "   4. Test the website at https://mosabri.top" 