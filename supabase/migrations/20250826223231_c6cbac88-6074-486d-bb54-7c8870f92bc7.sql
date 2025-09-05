-- Fix security issue: Remove public access to sensitive dose records
-- Only allow authenticated users to view dose data

-- Drop the existing policy that allows anyone to view doses
DROP POLICY IF EXISTS "Anyone can view doses" ON public.doses;

-- Create a new policy that requires authentication to view doses
CREATE POLICY "Only authenticated users can view doses" 
ON public.doses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep medications publicly readable since they contain general drug information, not patient data
-- (medications table policies remain unchanged as they don't contain sensitive patient information)