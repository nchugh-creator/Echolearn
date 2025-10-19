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

-- Rewards and Achievements Tables
CREATE TABLE public.user_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.reward_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    coins_earned INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_key VARCHAR(100) NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
);

CREATE TABLE public.reward_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reward_type VARCHAR(100) NOT NULL,
    coins_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VISA Gift Cards Table
CREATE TABLE public.visa_gift_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    amount_usd INTEGER NOT NULL,
    coins_spent INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VISA Redemption Requests Table
CREATE TABLE public.visa_redemption_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount_usd INTEGER NOT NULL,
    coins_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    request_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rewards system
CREATE INDEX idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX idx_reward_transactions_user_id ON public.reward_transactions(user_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX idx_visa_gift_cards_user_id ON public.visa_gift_cards(user_id);
CREATE INDEX idx_visa_redemption_requests_user_id ON public.visa_redemption_requests(user_id);
CREATE INDEX idx_visa_gift_cards_status ON public.visa_gift_cards(status);
CREATE INDEX idx_visa_redemption_requests_status ON public.visa_redemption_requests(status);

-- RLS Policies for rewards system
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_redemption_requests ENABLE ROW LEVEL SECURITY;

-- User rewards policies
CREATE POLICY "Users can view own rewards" ON public.user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards" ON public.user_rewards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON public.user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reward transactions policies
CREATE POLICY "Users can view own transactions" ON public.reward_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.reward_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reward redemptions policies
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VISA gift cards policies
CREATE POLICY "Users can view own gift cards" ON public.visa_gift_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gift cards" ON public.visa_gift_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gift cards" ON public.visa_gift_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- VISA redemption requests policies
CREATE POLICY "Users can view own visa requests" ON public.visa_redemption_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visa requests" ON public.visa_redemption_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visa requests" ON public.visa_redemption_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for rewards system
CREATE TRIGGER update_user_rewards_updated_at BEFORE UPDATE ON public.user_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user rewards on signup
CREATE OR REPLACE FUNCTION public.initialize_user_rewards()
RETURNS TRIGGER AS $
BEGIN
  -- Create rewards record with welcome bonus
  INSERT INTO public.user_rewards (user_id, balance, total_earned)
  VALUES (NEW.id, 50, 50);
  
  -- Create initial achievements
  INSERT INTO public.user_achievements (user_id, achievement_key, progress, target) VALUES
    (NEW.id, 'first-note', 0, 1),
    (NEW.id, 'flashcard-master', 0, 10),
    (NEW.id, 'daily-learner', 0, 7),
    (NEW.id, 'voice-champion', 0, 50);
  
  -- Add welcome bonus transaction
  INSERT INTO public.reward_transactions (user_id, activity_type, coins_earned, description)
  VALUES (NEW.id, 'welcome', 50, 'Welcome bonus');
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize rewards for new users
CREATE TRIGGER on_user_rewards_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_rewards();

-- Sample data (optional - remove in production)
-- INSERT INTO public.feedback (name, email, type, subject, message, rating)
-- VALUES ('Test User', 'test@example.com', 'general', 'Great platform!', 'EchoLearn is amazing for accessibility.', 5);

COMMIT;