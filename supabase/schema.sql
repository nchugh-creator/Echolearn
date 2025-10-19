-- EchoLearn Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  age INTEGER,
  disability TEXT,
  memo TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('accessibility', 'feature', 'bug', 'usability', 'general', 'testimonial')),
  disability TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  send_copy BOOLEAN DEFAULT FALSE,
  updates BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  pdf_filename TEXT,
  pdf_path TEXT,
  cards JSONB NOT NULL, -- Array of {question, answer} objects
  total_cards INTEGER NOT NULL,
  study_progress JSONB DEFAULT '{}', -- Track which cards were studied
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for tracking active sessions)
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_data JSONB,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_created_at ON public.flashcards(created_at DESC);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Feedback policies (users can insert, admins can view all)
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

-- Storage policies for PDFs
CREATE POLICY "Users can upload own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own PDFs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sample data (optional - remove in production)
-- INSERT INTO public.feedback (name, email, type, subject, message, rating)
-- VALUES ('Test User', 'test@example.com', 'general', 'Great platform!', 'EchoLearn is amazing for accessibility.', 5);

COMMIT;