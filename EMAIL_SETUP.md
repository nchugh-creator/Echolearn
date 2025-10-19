# Email Setup Guide for EchoLearn Feedback Form

## 🚀 Quick Setup Options

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Click "2-Step Verification" → "App passwords"
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Update .env file**:
   ```bash
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   FEEDBACK_EMAIL=your-email@gmail.com
   ```

### Option 2: Custom SMTP (Production)

```bash
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@echolearn.us
FEEDBACK_EMAIL=feedback@echolearn.us
```

### Option 3: SendGrid (Scalable)

```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@echolearn.us
FEEDBACK_EMAIL=feedback@echolearn.us
```

## 📧 What Happens When Feedback is Submitted

### Admin Email (sent to FEEDBACK_EMAIL):
- ✅ Complete feedback details
- ✅ User information and ratings
- ✅ Accessibility needs context
- ✅ Technical details (user agent, timestamp)
- ✅ Professional HTML formatting

### User Confirmation Email (if requested):
- ✅ Thank you message
- ✅ Copy of their feedback
- ✅ Response timeline expectations
- ✅ Professional branding

## 🔧 Testing Email Setup

1. **Start server**: `npm start`
2. **Check logs**: Look for "📧 Email transporter initialized successfully"
3. **Submit test feedback**: Use the feedback form
4. **Verify emails**: Check both admin and user email addresses

## 🛠️ Troubleshooting

### "Email not configured" message:
- Check .env file exists and has correct variables
- Restart server after updating .env
- Verify email credentials are correct

### Gmail "Less secure app" error:
- Use App Password instead of regular password
- Enable 2-Factor Authentication first
- Generate specific app password for mail

### SMTP connection errors:
- Verify host, port, and security settings
- Check firewall/network restrictions
- Test credentials with email provider

## 📊 Email Features

### Accessibility-Focused:
- ✅ Screen reader friendly HTML
- ✅ High contrast colors
- ✅ Clear structure and headings
- ✅ Professional formatting

### User Experience:
- ✅ Instant confirmation
- ✅ Copy of feedback for records
- ✅ Clear response expectations
- ✅ Professional branding

### Admin Features:
- ✅ Complete feedback context
- ✅ User accessibility needs
- ✅ Technical debugging info
- ✅ Easy response workflow

## 🔒 Security Notes

- Never commit .env file to version control
- Use app passwords, not regular passwords
- Rotate email credentials regularly
- Monitor email usage and costs
- Set up proper SPF/DKIM records for production

## 📈 Production Recommendations

1. **Use dedicated email service** (SendGrid, Mailgun, SES)
2. **Set up proper domain** with SPF/DKIM
3. **Monitor email delivery rates**
4. **Implement rate limiting** for feedback submissions
5. **Store feedback in database** for analytics
6. **Set up email templates** for different feedback types

---

**The feedback form works without email configuration - it will log feedback to console for development!**