# Deploy EchoLearn to Production

## 🚀 Quick Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Configure Environment Variables
In Vercel dashboard, add these environment variables:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key  
- `AWS_REGION`: us-east-1
- `BEDROCK_MODEL_ID`: anthropic.claude-3-sonnet-20240229-v1:0

### 5. Connect Domain
- Go to Vercel dashboard
- Click on your project
- Go to Settings → Domains
- Add `echolearn.us`

### 6. Update Supabase
- Site URL: `https://echolearn.us`
- Redirect URLs: `https://echolearn.us`

## ✅ After Deployment

Your AI flashcards will work at:
- `https://echolearn.us/api/upload` (flashcard generation)
- `https://echolearn.us/api/bedrock-status` (AI status check)

## 🔧 Alternative: Railway Deployment

1. Go to railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy automatically

## 📱 Mobile Access

Once deployed, mobile users can access:
- `https://echolearn.us` - Full functionality
- AI flashcards will work on mobile
- All features accessible worldwide