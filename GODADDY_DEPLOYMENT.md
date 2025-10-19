# EchoLearn Deployment with GoDaddy Domain

## 🌐 Complete Deployment Guide for echolearn.us

### Step 1: Deploy to Vercel (Hosting Platform)

#### 1.1 Create Vercel Account
1. **Visit**: [vercel.com](https://vercel.com)
2. **Sign up** with GitHub account
3. **Connect GitHub**: Allow Vercel to access your repositories

#### 1.2 Deploy EchoLearn
1. **New Project**: Click "Add New..." → "Project"
2. **Import Git Repository**: 
   - Find `nchugh-creator/echolearn`
   - Click "Import"
3. **Configure Project**:
   - Project Name: `echolearn`
   - Framework Preset: `Other`
   - Root Directory: `./` (default)
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Install Command: `npm install`
4. **Deploy**: Click "Deploy" button
5. **Wait**: Deployment takes 2-3 minutes
6. **Get URL**: Copy the generated URL (e.g., `https://echolearn-abc123.vercel.app`)

### Step 2: Configure GoDaddy DNS

#### 2.1 Get Vercel IP Address
1. **In Vercel Dashboard**: Go to your project → Settings → Domains
2. **Add Domain**: Click "Add" and enter `echolearn.us`
3. **Copy DNS Records**: Vercel will show you the required DNS settings

#### 2.2 Update GoDaddy DNS Settings
1. **Login to GoDaddy**: Go to [godaddy.com](https://godaddy.com)
2. **My Products**: Click "DNS" next to echolearn.us
3. **DNS Management**: Click "Manage DNS"

#### 2.3 Add DNS Records
**Delete existing A records** and add these:

```
Type: A
Name: @
Value: 76.76.19.19
TTL: 1 Hour

Type: A  
Name: www
Value: 76.76.19.19
TTL: 1 Hour

Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 1 Hour
```

**Important**: 
- Delete any existing A records for @ and www
- Keep MX records if you have email setup
- Save changes

#### 2.4 Verify Domain in Vercel
1. **Back to Vercel**: Go to Settings → Domains
2. **Check Status**: Should show "Valid Configuration" (may take 5-60 minutes)
3. **SSL Certificate**: Will be automatically generated

### Step 3: Environment Variables Setup

#### 3.1 Configure Production Environment
In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# Domain Configuration
DOMAIN=echolearn.us
BASE_URL=https://echolearn.us
NODE_ENV=production

# Supabase (when you set it up)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Bedrock (optional - for AI flashcards)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FEEDBACK_EMAIL=feedback@echolearn.us
```

#### 3.2 Redeploy
1. **Trigger Redeploy**: Go to Deployments → Click "..." → Redeploy
2. **Wait for Build**: Takes 2-3 minutes
3. **Test**: Visit https://echolearn.us

### Step 4: Set Up Professional Email (Optional)

#### 4.1 GoDaddy Email Setup
1. **GoDaddy Dashboard**: Go to "Email & Office"
2. **Add Email**: Set up `feedback@echolearn.us`
3. **Configure MX Records**: GoDaddy will do this automatically

#### 4.2 Alternative: Google Workspace
1. **Sign up**: [workspace.google.com](https://workspace.google.com)
2. **Add Domain**: echolearn.us
3. **Verify Ownership**: Add TXT record to GoDaddy DNS
4. **Configure MX Records**: Add Google's MX records to GoDaddy

### Step 5: Supabase Database Setup (Recommended)

#### 5.1 Create Supabase Project
1. **Visit**: [supabase.com](https://supabase.com)
2. **New Project**: 
   - Name: `EchoLearn Production`
   - Region: `US East (N. Virginia)`
   - Strong password
3. **Wait**: 2-3 minutes for setup

#### 5.2 Configure Database
1. **SQL Editor**: Copy contents of `supabase/schema.sql`
2. **Run Script**: Paste and execute
3. **Verify**: Check Tables are created

#### 5.3 Get Credentials
1. **Settings → API**: Copy URL and keys
2. **Update Vercel**: Add environment variables
3. **Update Code**: Update `supabase-client.js` with real credentials

### Step 6: Testing & Go Live

#### 6.1 DNS Propagation Check
```bash
# Check if DNS is working
nslookup echolearn.us
dig echolearn.us

# Or use online tools:
# https://dnschecker.org
```

#### 6.2 Test Website
1. **Visit**: https://echolearn.us
2. **Test Features**:
   - Sign up for account
   - Create notes
   - Upload PDF for flashcards
   - Submit feedback
   - Test speech features

#### 6.3 SSL Certificate Verification
- Should automatically show 🔒 in browser
- Certificate issued by Let's Encrypt
- Valid for echolearn.us and www.echolearn.us

### Step 7: Monitoring & Maintenance

#### 7.1 Set Up Monitoring
1. **Vercel Analytics**: Enable in dashboard
2. **Uptime Monitoring**: Use UptimeRobot or Pingdom
3. **Error Tracking**: Monitor Vercel function logs

#### 7.2 Regular Maintenance
- **Weekly**: Check Vercel deployment logs
- **Monthly**: Review Supabase usage and performance
- **Quarterly**: Update dependencies and security patches

## 🚨 Troubleshooting

### DNS Issues
**Problem**: echolearn.us not loading
**Solution**: 
- Wait 24-48 hours for full DNS propagation
- Check GoDaddy DNS settings match Vercel requirements
- Use incognito browser to avoid cache

### SSL Certificate Issues
**Problem**: "Not Secure" warning
**Solution**:
- Wait for automatic SSL generation (up to 24 hours)
- Verify domain is properly configured in Vercel
- Check DNS records are correct

### Deployment Failures
**Problem**: Build fails in Vercel
**Solution**:
- Check Vercel function logs
- Verify environment variables are set
- Ensure all dependencies are in package.json

## 📊 Expected Timeline

- **Vercel Deployment**: 5 minutes
- **GoDaddy DNS Update**: 5 minutes
- **DNS Propagation**: 5 minutes - 24 hours
- **SSL Certificate**: 5 minutes - 2 hours
- **Total**: 30 minutes - 24 hours (mostly waiting)

## 💰 Cost Breakdown

- **GoDaddy Domain**: Already paid
- **Vercel Hosting**: Free tier (100GB bandwidth)
- **Supabase Database**: Free tier (500MB, 50K users)
- **AWS Bedrock**: Pay per use (~$0.01 per PDF)
- **Total Monthly**: $0 to start

## 🎯 Success Checklist

- [ ] Vercel project deployed successfully
- [ ] GoDaddy DNS records updated
- [ ] echolearn.us loads without errors
- [ ] SSL certificate active (🔒 in browser)
- [ ] User registration works
- [ ] All features functional
- [ ] Mobile responsive
- [ ] Accessibility features working

---

## 🚀 Final Steps

Once DNS propagates (usually 5-60 minutes):

1. **Visit**: https://echolearn.us
2. **Test thoroughly**: All features should work
3. **Share with team**: Your live website is ready!
4. **Monitor**: Keep an eye on performance and usage

**Your EchoLearn platform will be live at https://echolearn.us!** 🎉

**Need help?** Check Vercel dashboard logs or GoDaddy support for DNS issues.