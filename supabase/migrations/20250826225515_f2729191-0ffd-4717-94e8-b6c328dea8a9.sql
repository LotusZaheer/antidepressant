-- Fix Profile Data Security: Replace public access with user-specific access
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Fix Medical Data Security: Keep public read access but secure modifications
DROP POLICY IF EXISTS "Only authenticated users can manage doses" ON public.doses;

-- Separate policies for better security granularity
CREATE POLICY "Authenticated users can insert doses" 
ON public.doses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update doses" 
ON public.doses 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete doses" 
ON public.doses 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Similar fixes for medications table
DROP POLICY IF EXISTS "Only authenticated users can manage medications" ON public.medications;

CREATE POLICY "Authenticated users can insert medications" 
ON public.medications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update medications" 
ON public.medications 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete medications" 
ON public.medications 
FOR DELETE 
USING (auth.uid() IS NOT NULL);