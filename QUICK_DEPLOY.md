# 🚀 Quick Deploy EchoLearn to echolearn.us

## ⚡ 15-Minute Deployment Guide

### Step 1: Deploy to Vercel (5 minutes)
1. **Go to**: [vercel.com](https://vercel.com)
2. **Sign up** with GitHub
3. **Import project**: `nchugh-creator/echolearn`
4. **Click Deploy** (wait 2-3 minutes)
5. **Copy the URL** (e.g., `echolearn-abc123.vercel.app`)

### Step 2: Configure GoDaddy DNS (5 minutes)
1. **Login to GoDaddy**: [godaddy.com](https://godaddy.com)
2. **Go to**: My Products → DNS (next to echolearn.us)
3. **Delete existing A records** for @ and www
4. **Add these records**:
   ```
   Type: A, Name: @, Value: 76.76.19.19
   Type: A, Name: www, Value: 76.76.19.19
   Type: CNAME, Name: *, Value: cname.vercel-dns.com
   ```
5. **Save changes**

### Step 3: Add Domain to Vercel (2 minutes)
1. **In Vercel**: Go to your project → Settings → Domains
2. **Add domain**: `echolearn.us`
3. **Add www**: `www.echolearn.us`
4. **Wait for verification** ✅

### Step 4: Wait & Test (5-60 minutes)
1. **DNS Propagation**: Usually 5-30 minutes
2. **Check**: https://echolearn.us
3. **SSL Certificate**: Automatic (look for 🔒)
4. **Test features**: Sign up, create notes, etc.

## 🎯 That's It!

**Your website will be live at**: https://echolearn.us

**Current status**: http://localhost:3000 (development)
**After deployment**: https://echolearn.us (production)

## 🔧 Optional Enhancements (Later)

### Add Database (Supabase)
- Follow `SUPABASE_SETUP.md`
- Persistent user accounts and notes
- 15 minutes setup

### Add AI Features (AWS Bedrock)  
- Follow `BEDROCK_SETUP.md`
- Smarter flashcard generation
- 10 minutes setup

### Add Email (Gmail/Professional)
- Follow `EMAIL_SETUP.md`
- Feedback form emails
- 5 minutes setup

---

**Ready to deploy?** Start with Step 1! 🚀