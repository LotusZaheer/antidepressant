-- Revert security policy to allow public access to doses
-- The user wants everyone to be able to see their doses

-- Drop the current restricted policy
DROP POLICY IF EXISTS "Only authenticated users can view doses" ON public.doses;

-- Create a new policy that allows anyone to view doses
CREATE POLICY "Anyone can view doses" 
ON public.doses 
FOR SELECT 
USING (true);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  can_edit boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view profiles (public app)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, can_edit)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE WHEN new.email = 'andresfelipeuribe11@gmail.com' THEN true ELSE false END
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();