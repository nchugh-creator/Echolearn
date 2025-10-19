#!/bin/bash

echo "🚀 Deploying EchoLearn to Production..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to Vercel dashboard"
echo "2. Add environment variables:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY" 
echo "   - AWS_REGION"
echo "   - BEDROCK_MODEL_ID"
echo "3. Connect echolearn.us domain"
echo "4. Test AI flashcards at https://echolearn.us"