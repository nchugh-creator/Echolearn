# EchoLearn Deployment Guide

## 🌐 Domain: echolearn.us

### Production Deployment Options

#### Option 1: Vercel (Recommended for Node.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure custom domain
vercel domains add echolearn.us
vercel alias your-deployment-url.vercel.app echolearn.us
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Configure custom domain in Netlify dashboard
```

#### Option 3: AWS (Full Control)
```bash
# Using AWS Elastic Beanstalk
eb init echolearn
eb create production
eb deploy

# Configure Route 53 for echolearn.us
```

#### Option 4: DigitalOcean App Platform
```bash
# Connect GitHub repository
# Configure build settings
# Add custom domain echolearn.us
```

### Environment Variables for Production

```bash
# Production .env
NODE_ENV=production
PORT=3000

# Domain Configuration
DOMAIN=echolearn.us
BASE_URL=https://echolearn.us

# Email Configuration
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-production-api-key
EMAIL_FROM=noreply@echolearn.us
FEEDBACK_EMAIL=feedback@echolearn.us

# AWS Bedrock (Production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-production-key
AWS_SECRET_ACCESS_KEY=your-production-secret
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Security
SESSION_SECRET=your-secure-session-secret
CORS_ORIGIN=https://echolearn.us
```

### DNS Configuration for echolearn.us

#### A Records
```
@ (root)    →  Your server IP
www         →  Your server IP
```

#### CNAME Records
```
api         →  your-api-server.com
cdn         →  your-cdn-provider.com
```

#### MX Records (for email)
```
@           →  mail.echolearn.us (Priority 10)
```

#### TXT Records
```
@           →  "v=spf1 include:_spf.google.com ~all"
_dmarc      →  "v=DMARC1; p=quarantine; rua=mailto:dmarc@echolearn.us"
```

### SSL Certificate Setup

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d echolearn.us -d www.echolearn.us

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare (Recommended)
1. Add echolearn.us to Cloudflare
2. Update nameservers at your registrar
3. Enable "Full (Strict)" SSL mode
4. Configure page rules for optimization

### Performance Optimization

#### CDN Configuration
```javascript
// Add to server.js
app.use(express.static('public', {
  maxAge: '1y',
  etag: false
}));

// Gzip compression
const compression = require('compression');
app.use(compression());
```

#### Caching Headers
```javascript
// Cache static assets
app.use('/assets', express.static('assets', {
  maxAge: '365d',
  immutable: true
}));
```

### Monitoring & Analytics

#### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    domain: 'echolearn.us',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

#### Error Tracking
```bash
# Install Sentry
npm install @sentry/node

# Configure in server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

### Security Configuration

#### CORS Setup
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://echolearn.us', 'https://www.echolearn.us'],
  credentials: true
}));
```

#### Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### Backup Strategy

#### Database Backup (if using)
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --out /backups/echolearn_$DATE
aws s3 cp /backups/echolearn_$DATE s3://echolearn-backups/
```

#### File Backup
```bash
# Backup user uploads
rsync -av /app/uploads/ s3://echolearn-files/
```

### Deployment Checklist

- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Email service configured
- [ ] AWS Bedrock access enabled
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance optimization enabled
- [ ] Error tracking configured
- [ ] Health checks working

### Post-Deployment Testing

1. **Accessibility Testing**
   ```bash
   # Test with axe-core
   npx @axe-core/cli https://echolearn.us
   ```

2. **Performance Testing**
   ```bash
   # Lighthouse audit
   npx lighthouse https://echolearn.us --output=html
   ```

3. **Security Testing**
   ```bash
   # Security headers check
   curl -I https://echolearn.us
   ```

### Maintenance

#### Regular Updates
```bash
# Update dependencies monthly
npm audit
npm update

# Security patches
npm audit fix
```

#### Monitoring
- Set up uptime monitoring (Pingdom, UptimeRobot)
- Configure log aggregation (LogRocket, Papertrail)
- Monitor performance metrics (New Relic, DataDog)

---

**Your EchoLearn platform will be live at https://echolearn.us** 🚀