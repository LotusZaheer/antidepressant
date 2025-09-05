-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  half_life DECIMAL NOT NULL, -- in hours
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doses table
CREATE TABLE public.doses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL, -- in mg
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (allow public read access since visitors should see data)
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doses ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view medications" 
ON public.medications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view doses" 
ON public.doses 
FOR SELECT 
USING (true);

-- Only allow inserts/updates/deletes for authenticated users (admin only in this case)
CREATE POLICY "Only authenticated users can manage medications" 
ON public.medications 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can manage doses" 
ON public.doses 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial medications
INSERT INTO public.medications (name, half_life, color) VALUES
('Escitalopram', 30, 'hsl(var(--medical-blue))'),
('Bupiron', 24, 'hsl(var(--medical-teal))');

-- Insert initial doses
INSERT INTO public.doses (medication_id, amount, timestamp) VALUES
((SELECT id FROM public.medications WHERE name = 'Escitalopram'), 10, now() - interval '10 hours'),
((SELECT id FROM public.medications WHERE name = 'Bupiron'), 20, now() - interval '6 hours');