// Supabase Configuration for EchoLearn
import { createClient } from '@supabase/supabase-js'

// Supabase credentials (add these to your .env file)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Users table operations
  users: {
    async create(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
      return { data: data?.[0], error }
    },
    
    async getById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },
    
    async getByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      return { data, error }
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
      return { data: data?.[0], error }
    }
  },
  
  // Notes table operations
  notes: {
    async create(noteData) {
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
      return { data: data?.[0], error }
    },
    
    async getByUserId(userId) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
      return { data: data?.[0], error }
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      return { error }
    }
  },
  
  // Feedback table operations
  feedback: {
    async create(feedbackData) {
      const { data, error } = await supabase
        .from('feedback')
        .insert([feedbackData])
        .select()
      return { data: data?.[0], error }
    },
    
    async getAll() {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    }
  },
  
  // Flashcards table operations
  flashcards: {
    async create(flashcardData) {
      const { data, error } = await supabase
        .from('flashcards')
        .insert([flashcardData])
        .select()
      return { data: data?.[0], error }
    },
    
    async getByUserId(userId) {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id)
      return { error }
    }
  }
}

// Authentication helper functions
export const auth = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },
  
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }
}

// File storage helper functions
export const storage = {
  async uploadPDF(file, userId) {
    const fileName = `${userId}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(fileName, file)
    return { data, error }
  },
  
  async downloadPDF(path) {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .download(path)
    return { data, error }
  },
  
  async deletePDF(path) {
    const { error } = await supabase.storage
      .from('pdfs')
      .remove([path])
    return { error }
  }
}