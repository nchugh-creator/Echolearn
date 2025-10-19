# Deploy EchoLearn Backend to Make AI Work on Domain

## 🎯 Problem
- AI works on `localhost:3000` ✅
- AI doesn't work on `echolearn.us` ❌
- Domain needs backend server for AWS Bedrock

## 🚀 Solution: Deploy Backend to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Project
```bash
vercel --prod
```

### Step 4: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-sonnet-20240229-v1:0` |

### Step 5: Connect Domain
1. Vercel Dashboard → Your Project
2. Settings → Domains
3. Add `echolearn.us`
4. Follow DNS instructions

### Step 6: Update Supabase
- Authentication → Settings
- Site URL: `https://echolearn.us`
- Redirect URLs: `https://echolearn.us`

## ✅ Test AI Connection

After deployment, test:
- `https://echolearn.us/api/bedrock-status`
- Should return: `{"status": "connected"}`

## 🔧 Alternative: Quick Deploy Script

Run the deployment script:
```bash
./deploy.sh
```

## 📱 Result

Once deployed:
- ✅ AI flashcards work on `echolearn.us`
- ✅ Mobile users can access AI features
- ✅ All backend functionality available worldwide

## 🆘 Troubleshooting

If AI still doesn't work:
1. Check Vercel function logs
2. Verify environment variables are set
3. Test `/api/bedrock-status` endpoint
4. Check AWS credentials and permissions