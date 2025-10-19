# Supabase Setup Guide for EchoLearn

## 🚀 Quick Setup Steps

### 1. Create Supabase Project

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Sign Up/Login**: Create account or login
3. **New Project**: Click "New Project"
4. **Project Details**:
   - Name: `EchoLearn`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
5. **Create Project**: Wait for setup (2-3 minutes)

### 2. Get Project Credentials

1. **Go to Settings** → **API**
2. **Copy these values**:
   - Project URL: `https://your-project.supabase.co`
   - Anon (public) key: `eyJ...` (long string)
   - Service role key: `eyJ...` (keep secret!)

### 3. Update Configuration Files

#### Update `.env` file:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Update `supabase-client.js`:
```javascript
// Replace these lines (around line 4-5):
const SUPABASE_URL = 'https://your-project.supabase.co'; // Your actual URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Your actual anon key
```

### 4. Set Up Database Schema

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy contents** of `supabase/schema.sql`
3. **Paste and Run** the SQL script
4. **Verify tables created**: Check Database → Tables

### 5. Configure Authentication

1. **Go to Authentication** → **Settings**
2. **Site URL**: Add `https://echolearn.us` (and `http://localhost:3000` for development)
3. **Email Templates**: Customize signup/reset emails (optional)
4. **Providers**: Enable email/password (default)

### 6. Set Up Storage

1. **Go to Storage** → **Buckets**
2. **Verify `pdfs` bucket** exists (created by schema)
3. **Check policies** are applied for user access

## 🧪 Testing the Setup

### 1. Test Database Connection
```bash
# Start your server
npm start

# Check browser console for Supabase connection
# Should see: "Supabase client initialized"
```

### 2. Test User Registration
1. **Open**: http://localhost:3000
2. **Sign Up**: Create test account
3. **Check Supabase**: Go to Authentication → Users
4. **Verify**: User appears in dashboard

### 3. Test Database Operations
1. **Create Note**: Use the notes feature
2. **Check Database**: Go to Database → Table Editor → notes
3. **Verify**: Note appears in table

## 📊 Database Tables Created

### `users` - User Profiles
- `id` (UUID, primary key)
- `email` (text, unique)
- `name` (text)
- `city` (text)
- `age` (integer)
- `disability` (text)
- `memo` (text)
- `preferences` (JSON)
- `created_at`, `updated_at` (timestamps)

### `notes` - User Notes
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `title` (text)
- `content` (text)
- `tags` (text array)
- `is_favorite` (boolean)
- `created_at`, `updated_at` (timestamps)

### `feedback` - User Feedback
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key, nullable)
- `name`, `email` (text)
- `type` (enum: accessibility, feature, bug, etc.)
- `disability` (text)
- `rating` (integer 1-5)
- `subject`, `message` (text)
- `status` (enum: new, in_progress, resolved, closed)
- `created_at`, `updated_at` (timestamps)

### `flashcards` - Generated Flashcards
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `title` (text)
- `pdf_filename` (text)
- `cards` (JSON array of Q&A pairs)
- `total_cards` (integer)
- `study_progress` (JSON)
- `created_at`, `updated_at` (timestamps)

## 🔒 Security Features

### Row Level Security (RLS)
- ✅ Users can only access their own data
- ✅ Feedback can be submitted by anyone
- ✅ Admins can view all feedback
- ✅ File storage restricted to user folders

### Authentication
- ✅ Email/password authentication
- ✅ Email verification (optional)
- ✅ Password reset functionality
- ✅ Session management
- ✅ JWT tokens for API access

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Production Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# Update allowed origins
# In Supabase: Authentication → Settings → Site URL
# Add: https://echolearn.us
```

### Performance Optimization
1. **Enable Connection Pooling**: Database → Settings → Connection Pooling
2. **Set up CDN**: For faster global access
3. **Monitor Usage**: Database → Reports
4. **Backup Strategy**: Database → Backups

## 🛠️ Troubleshooting

### Common Issues

#### "Invalid API key" error:
- Check SUPABASE_ANON_KEY is correct
- Verify project URL matches
- Ensure no extra spaces in .env file

#### "Row Level Security" errors:
- Check RLS policies are applied
- Verify user is authenticated
- Test with service role key for debugging

#### Authentication not working:
- Check Site URL in Supabase settings
- Verify email templates are configured
- Check browser console for errors

#### Database connection fails:
- Verify project is not paused (free tier)
- Check network connectivity
- Verify credentials are correct

### Debug Mode
```javascript
// Add to supabase-client.js for debugging
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    debug: true // Enable auth debugging
  }
});
```

## 📈 Monitoring & Analytics

### Supabase Dashboard
- **Authentication**: Monitor user signups/logins
- **Database**: Track table usage and performance
- **Storage**: Monitor file uploads and storage usage
- **API**: View API request logs and errors

### Custom Analytics
```javascript
// Track user actions
await supabaseClient
  .from('user_sessions')
  .insert([{
    user_id: user.id,
    session_data: { action: 'note_created', timestamp: new Date() }
  }]);
```

## 💰 Cost Management

### Free Tier Limits
- **Database**: 500MB storage
- **Auth**: 50,000 monthly active users
- **Storage**: 1GB file storage
- **API**: 2 million API requests

### Optimization Tips
- Use RLS policies to reduce unnecessary queries
- Implement pagination for large datasets
- Compress images and files before upload
- Monitor usage in Supabase dashboard

---

**Your EchoLearn platform now has a professional database backend!** 🎉

After setup, users will have:
- ✅ **Persistent accounts** across devices
- ✅ **Saved notes** that sync everywhere
- ✅ **Stored flashcards** for future study
- ✅ **Feedback tracking** for administrators
- ✅ **File storage** for PDF uploads