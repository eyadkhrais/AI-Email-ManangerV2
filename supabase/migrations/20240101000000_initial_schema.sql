-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  price_id TEXT,
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  current_period_start BIGINT,
  current_period_end BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Create gmail_tokens table
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for gmail_tokens
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gmail tokens" 
  ON gmail_tokens FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gmail tokens" 
  ON gmail_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gmail tokens" 
  ON gmail_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  gmail_id TEXT NOT NULL,
  thread_id TEXT,
  from_email TEXT,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  requires_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for emails
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emails" 
  ON emails FOR SELECT 
  USING (auth.uid() = user_id);

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email_id UUID REFERENCES emails ON DELETE CASCADE NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for drafts
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" 
  ON drafts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
  ON drafts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" 
  ON drafts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" 
  ON drafts FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 