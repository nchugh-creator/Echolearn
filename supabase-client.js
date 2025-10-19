// Client-side Supabase integration for EchoLearn
// This file handles all database operations from the browser

// Supabase client configuration
// Your actual Supabase credentials
const SUPABASE_URL = 'https://qonntcyphcsqqbokykav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbm50Y3lwaGNzcXFib2t5a2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDUxOTEsImV4cCI6MjA3NjM4MTE5MX0.d2TQrgyP_x4kwhp-PP3EbMgn0Xt8XoJhR4uLFgYPCf0';

// For development, you can also use environment variables:
// const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Import Supabase (loaded from CDN in HTML)
const { createClient } = supabase;

// Initialize Supabase client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test connection on load
console.log('🔗 Supabase client initialized');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Test database connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connected successfully!');
    }
  } catch (err) {
    console.error('❌ Supabase test failed:', err);
  }
}

// Test connection when page loads
setTimeout(testSupabaseConnection, 1000);

// Database operations
const SupabaseDB = {
  // Authentication
  auth: {
    async signUp(email, password, userData) {
      try {
        console.log('🔄 Attempting signup for:', email);
        
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: userData.name,
              city: userData.city,
              age: userData.age,
              disability: userData.disability,
              memo: userData.memo
            }
          }
        });
        
        if (error) {
          console.error('❌ Signup error:', error);
          throw error;
        }
        
        console.log('✅ Signup successful:', data);
        
        // Create user profile
        if (data.user) {
          console.log('👤 Creating user profile...');
          await this.createUserProfile(data.user.id, userData);
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('❌ Signup error:', error);
        return { data: null, error };
      }
    },
    
    async signIn(email, password) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Signin error:', error);
        return { data: null, error };
      }
    },
    
    async signOut() {
      try {
        const { error } = await supabaseClient.auth.signOut();
        return { error };
      } catch (error) {
        console.error('Signout error:', error);
        return { error };
      }
    },
    
    async getCurrentUser() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
      } catch (error) {
        console.error('Get user error:', error);
        return null;
      }
    },
    
    async createUserProfile(userId, userData) {
      try {
        console.log('👤 Creating profile for user:', userId);
        console.log('📝 User data:', userData);
        
        const { data, error } = await supabaseClient
          .from('users')
          .insert([{
            id: userId,
            email: userData.email,
            name: userData.name,
            city: userData.city,
            age: userData.age,
            disability: userData.disability,
            memo: userData.memo
          }]);
        
        if (error) {
          console.error('❌ Profile creation error:', error);
        } else {
          console.log('✅ Profile created successfully:', data);
        }
        
        return { data, error };
      } catch (error) {
        console.error('❌ Create profile error:', error);
        return { data: null, error };
      }
    }
  },
  
  // Notes operations
  notes: {
    async create(noteData) {
      try {
        const user = await SupabaseDB.auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabaseClient
          .from('notes')
          .insert([{
            user_id: user.id,
            title: noteData.title || 'Untitled Note',
            content: noteData.content,
            tags: noteData.tags || []
          }])
          .select();
        
        return { data: data?.[0], error };
      } catch (error) {
        console.error('Create note error:', error);
        return { data: null, error };
      }
    },
    
    async getAll() {
      try {
        const user = await SupabaseDB.auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabaseClient
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        return { data, error };
      } catch (error) {
        console.error('Get notes error:', error);
        return { data: [], error };
      }
    },
    
    async update(noteId, updates) {
      try {
        const { data, error } = await supabaseClient
          .from('notes')
          .update(updates)
          .eq('id', noteId)
          .select();
        
        return { data: data?.[0], error };
      } catch (error) {
        console.error('Update note error:', error);
        return { data: null, error };
      }
    },
    
    async delete(noteId) {
      try {
        const { error } = await supabaseClient
          .from('notes')
          .delete()
          .eq('id', noteId);
        
        return { error };
      } catch (error) {
        console.error('Delete note error:', error);
        return { error };
      }
    }
  },
  
  // Feedback operations
  feedback: {
    async create(feedbackData) {
      try {
        const user = await SupabaseDB.auth.getCurrentUser();
        
        const { data, error } = await supabaseClient
          .from('feedback')
          .insert([{
            user_id: user?.id || null,
            name: feedbackData.name,
            email: feedbackData.email,
            type: feedbackData.type,
            disability: feedbackData.disability,
            rating: feedbackData.rating,
            subject: feedbackData.subject,
            message: feedbackData.message,
            send_copy: feedbackData.sendCopy,
            updates: feedbackData.updates,
            user_agent: feedbackData.userAgent
          }])
          .select();
        
        return { data: data?.[0], error };
      } catch (error) {
        console.error('Create feedback error:', error);
        return { data: null, error };
      }
    }
  },
  
  // Flashcards operations
  flashcards: {
    async create(flashcardData) {
      try {
        const user = await SupabaseDB.auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabaseClient
          .from('flashcards')
          .insert([{
            user_id: user.id,
            title: flashcardData.title,
            pdf_filename: flashcardData.filename,
            cards: flashcardData.cards,
            total_cards: flashcardData.cards.length
          }])
          .select();
        
        return { data: data?.[0], error };
      } catch (error) {
        console.error('Create flashcards error:', error);
        return { data: null, error };
      }
    },
    
    async getAll() {
      try {
        const user = await SupabaseDB.auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabaseClient
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        return { data, error };
      } catch (error) {
        console.error('Get flashcards error:', error);
        return { data: [], error };
      }
    },
    
    async delete(flashcardId) {
      try {
        const { error } = await supabaseClient
          .from('flashcards')
          .delete()
          .eq('id', flashcardId);
        
        return { error };
      } catch (error) {
        console.error('Delete flashcards error:', error);
        return { error };
      }
    }
  }
};

// Authentication state listener
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
    // Update UI for signed in user
    if (typeof updateAuthUI === 'function') {
      updateAuthUI();
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Update UI for signed out user
    if (typeof showLoginRequired === 'function') {
      showLoginRequired();
    }
  }
});

// Export for use in other files
window.SupabaseDB = SupabaseDB;
window.supabaseClient = supabaseClient;