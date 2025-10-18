# AWS Bedrock Setup Guide for AccessiLearn

This guide will help you set up AWS Bedrock to generate AI-powered flashcards.

## 🚀 Quick Setup

### 1. AWS Account Setup
1. **Create AWS Account**: Go to [aws.amazon.com](https://aws.amazon.com) and create an account
2. **Enable Bedrock**: Go to AWS Console → Bedrock → Model access
3. **Request Model Access**: Enable access to Claude models (anthropic.claude-3-sonnet)

### 2. Get AWS Credentials

#### Option A: Access Keys (Simple)
1. Go to AWS Console → IAM → Users → Create User
2. Attach policy: `AmazonBedrockFullAccess`
3. Create access key → Download credentials
4. Update `.env` file:
```bash
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=us-east-1
```

#### Option B: AWS Profile (Recommended)
1. Install AWS CLI: `npm install -g @aws-cli/cli`
2. Configure: `aws configure`
3. Update `.env` file:
```bash
AWS_PROFILE=your-profile-name
AWS_REGION=us-east-1
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Test Connection
1. Start server: `npm start`
2. Visit: `http://localhost:3000/bedrock-status`
3. Should see: `"status": "connected"`

## 🤖 Available Models

Update `BEDROCK_MODEL_ID` in `.env`:

### Claude 3 Models (Recommended)
- **Haiku**: `anthropic.claude-3-haiku-20240307-v1:0` (Fast, cheap)
- **Sonnet**: `anthropic.claude-3-sonnet-20240229-v1:0` (Balanced, default)
- **Opus**: `anthropic.claude-3-opus-20240229-v1:0` (Most capable, expensive)

### Amazon Titan
- **Express**: `amazon.titan-text-express-v1` (Amazon's model)

## 💰 Cost Estimation

### Claude 3 Sonnet (Default)
- **Input**: $3 per 1M tokens (~750,000 words)
- **Output**: $15 per 1M tokens (~750,000 words)
- **Per PDF**: ~$0.01-0.05 (typical document)

### Claude 3 Haiku (Budget Option)
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens  
- **Per PDF**: ~$0.001-0.005 (very cheap)

## 🔧 Configuration Options

### Model Selection
```bash
# Fast and cheap
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Balanced (default)
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Most capable
BEDROCK_MODEL_ID=anthropic.claude-3-opus-20240229-v1:0
```

### Region Selection
```bash
# US East (most models available)
AWS_REGION=us-east-1

# US West
AWS_REGION=us-west-2

# Europe
AWS_REGION=eu-west-1
```

## 🛠️ Troubleshooting

### "Access Denied" Error
1. Check IAM permissions: Need `AmazonBedrockFullAccess`
2. Verify model access: AWS Console → Bedrock → Model access
3. Check region: Some models only available in specific regions

### "Model Not Found" Error
1. Verify model ID in `.env`
2. Check model availability in your region
3. Request access to the specific model

### "Credentials Not Found" Error
1. Check `.env` file exists and has correct values
2. Verify AWS CLI configuration: `aws sts get-caller-identity`
3. Try using AWS profile instead of access keys

### Connection Timeout
1. Check internet connection
2. Verify AWS region is correct
3. Try different region (us-east-1 recommended)

## 🎯 Testing

### 1. Check Status Endpoint
```bash
curl http://localhost:3000/bedrock-status
```

### 2. Test Flashcard Generation
1. Upload a PDF in the app
2. Check browser console for Bedrock logs
3. Verify flashcards are AI-generated (more natural language)

### 3. Monitor Costs
1. AWS Console → Billing → Cost Explorer
2. Filter by service: "Bedrock"
3. Set up billing alerts

## 🔒 Security Best Practices

1. **Use IAM Roles**: Instead of access keys when possible
2. **Least Privilege**: Only grant necessary Bedrock permissions
3. **Rotate Keys**: Regularly update access keys
4. **Environment Variables**: Never commit credentials to code
5. **Billing Alerts**: Set up cost monitoring

## 📊 Fallback Behavior

If Bedrock fails:
1. **Automatic Fallback**: Uses rule-based generation
2. **Error Logging**: Check server console for details
3. **User Notification**: Status indicator shows fallback mode
4. **No Interruption**: App continues working normally

## 🎓 Benefits of AI Flashcards

### Compared to Rule-Based:
- **Better Questions**: More natural, varied question types
- **Context Understanding**: Grasps document meaning
- **Accessibility Focus**: Optimized for students with disabilities
- **Adaptive Difficulty**: Adjusts to content complexity
- **Educational Best Practices**: Follows learning science principles

### Example Improvement:
**Rule-Based**: "What is machine learning?"
**AI-Generated**: "How does machine learning help students with learning disabilities access educational content more effectively?"

## 🚀 Ready to Go!

Once configured, your flashcards will be powered by state-of-the-art AI, creating much more intelligent and educational content for students with disabilities!