# EchoLearn Production Deployment Guide

## 🚀 Complete Deployment Process

### Step 1: Supabase Setup (Database)

#### 1.1 Create Supabase Project
1. **Visit**: [supabase.com](https://supabase.com)
2. **Sign up/Login** with GitHub or email
3. **New Project**: Click "New Project"
4. **Configure**:
   - Name: `EchoLearn Production`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users (US East for echolearn.us)
5. **Create Project** (takes 2-3 minutes)

#### 1.2 Configure Database
1. **Go to SQL Editor** in Supabase dashboard
2. **Copy entire contents** of `supabase/schema.sql`
3. **Paste and Run** the SQL script
4. **Verify**: Check Database → Tables (should see users, notes, feedback, flashcards)

#### 1.3 Get Credentials
1. **Go to Settings** → **API**
2. **Copy these values**:
   ```
   Project URL: https://xxxxx.supabase.co
   Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### 1.4 Configure Authentication
1. **Go to Authentication** → **Settings**
2. **Site URL**: Add `https://echolearn.us`
3. **Redirect URLs**: Add `https://echolearn.us/**`
4. **Email Templates**: Customize if needed

### Step 2: Vercel Deployment (Hosting)

#### 2.1 Prepare for Deployment
1. **Update supabase-client.js** with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://your-actual-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-actual-anon-key';
   ```

2. **Commit all changes**:
   ```bash
   git add .
   git commit -m "feat: Add Supabase integration for production"
   git push origin main
   ```

#### 2.2 Deploy to Vercel
1. **Visit**: [vercel.com](https://vercel.com)
2. **Sign up** with GitHub
3. **Import Project**: 
   - Click "New Project"
   - Import from GitHub: `nchugh-creator/echolearn`
   - Click "Import"

#### 2.3 Configure Environment Variables
In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Bedrock (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FEEDBACK_EMAIL=feedback@echolearn.us

# Domain
DOMAIN=echolearn.us
BASE_URL=https://echolearn.us
NODE_ENV=production
```

#### 2.4 Deploy
1. **Click "Deploy"** in Vercel
2. **Wait for build** (2-3 minutes)
3. **Get deployment URL**: `https://echolearn-xxx.vercel.app`

### Step 3: Domain Configuration

#### 3.1 Add Custom Domain in Vercel
1. **Go to Vercel project** → **Settings** → **Domains**
2. **Add Domain**: Enter `echolearn.us`
3. **Add www subdomain**: Enter `www.echolearn.us`
4. **Copy DNS records** shown by Vercel

#### 3.2 Configure DNS at Your Domain Registrar
Add these DNS records where you registered `echolearn.us`:

```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME  
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

#### 3.3 Wait for Propagation
- DNS changes take 5-60 minutes
- Check status in Vercel dashboard
- SSL certificate will be automatically generated

### Step 4: Email Configuration (Optional)

#### 4.1 Gmail Setup
1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Add to Vercel environment variables**:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

#### 4.2 Professional Email (Recommended)
Set up `feedback@echolearn.us`:
1. **Use Google Workspace** or similar
2. **Configure MX records** for echolearn.us
3. **Update environment variables** with professional email

### Step 5: AWS Bedrock Setup (Optional)

#### 5.1 AWS Account Setup
1. **Create AWS account** if you don't have one
2. **Go to Bedrock console** → **Model access**
3. **Request access** to Claude 3 models
4. **Wait for approval** (usually instant)

#### 5.2 Create IAM User
1. **Go to IAM** → **Users** → **Create user**
2. **Username**: `echolearn-bedrock`
3. **Attach policy**: `AmazonBedrockFullAccess`
4. **Create access key** → **Application running outside AWS**
5. **Copy credentials** and add to Vercel environment variables

### Step 6: Testing & Verification

#### 6.1 Test Core Functionality
1. **Visit**: https://echolearn.us
2. **Sign up** for new account
3. **Verify email** (if configured)
4. **Test features**:
   - Create notes (should save to Supabase)
   - Upload PDF and generate flashcards
   - Submit feedback
   - Speech-to-text and text-to-speech

#### 6.2 Check Database
1. **Go to Supabase** → **Database** → **Table Editor**
2. **Verify data** appears in tables:
   - `users` table has new user
   - `notes` table has created notes
   - `feedback` table has submitted feedback

#### 6.3 Monitor Performance
1. **Vercel Analytics**: Check in Vercel dashboard
2. **Supabase Monitoring**: Check database performance
3. **Error Tracking**: Monitor Vercel function logs

### Step 7: Post-Deployment Setup

#### 7.1 Security Headers
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 7.2 Analytics Setup
1. **Google Analytics**: Add tracking code
2. **Vercel Analytics**: Enable in dashboard
3. **Supabase Analytics**: Monitor database usage

#### 7.3 Backup Strategy
1. **Database Backups**: Automatic in Supabase
2. **Code Backups**: GitHub repository
3. **Environment Variables**: Document securely

## 🎯 Final Checklist

### Pre-Launch
- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Vercel project deployed
- [ ] Environment variables configured
- [ ] Custom domain connected
- [ ] SSL certificate active
- [ ] Email service configured (optional)
- [ ] AWS Bedrock configured (optional)

### Post-Launch Testing
- [ ] User registration works
- [ ] User login works
- [ ] Notes save and load
- [ ] PDF upload and flashcard generation
- [ ] Feedback form submission
- [ ] Speech features work
- [ ] Mobile responsiveness
- [ ] Accessibility features

### Monitoring Setup
- [ ] Vercel analytics enabled
- [ ] Supabase monitoring configured
- [ ] Error tracking active
- [ ] Performance monitoring
- [ ] Backup verification

## 🚀 Go Live!

Once all steps are complete:

1. **Announce Launch**: Share https://echolearn.us
2. **Monitor Initial Traffic**: Watch for any issues
3. **Collect Feedback**: Use your own feedback form!
4. **Iterate and Improve**: Based on user feedback

## 📞 Support

If you encounter issues:

1. **Vercel Issues**: Check Vercel dashboard → Functions → Logs
2. **Supabase Issues**: Check Supabase dashboard → Logs
3. **DNS Issues**: Use DNS checker tools
4. **SSL Issues**: Wait 24 hours for propagation

---

**Your EchoLearn platform will be live at https://echolearn.us!** 🎉

**Estimated Total Time**: 2-4 hours (including DNS propagation)
**Cost**: Free tier for both Vercel and Supabase (scales as needed)