-- Rename medications table to products
ALTER TABLE public.medications RENAME TO products;

-- Rename doses table to quantities
ALTER TABLE public.doses RENAME TO quantities;

-- Update foreign key column name in quantities table
ALTER TABLE public.quantities RENAME COLUMN medication_id TO product_id;

-- Update RLS policies for products table
DROP POLICY "Anyone can view medications" ON public.products;
DROP POLICY "Authenticated users can delete medications" ON public.products;
DROP POLICY "Authenticated users can insert medications" ON public.products;
DROP POLICY "Authenticated users can update medications" ON public.products;

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can delete products" 
ON public.products 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Update RLS policies for quantities table
DROP POLICY "Anyone can view doses" ON public.quantities;
DROP POLICY "Authenticated users can delete doses" ON public.quantities;
DROP POLICY "Authenticated users can insert doses" ON public.quantities;
DROP POLICY "Authenticated users can update doses" ON public.quantities;

CREATE POLICY "Anyone can view quantities" 
ON public.quantities 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can delete quantities" 
ON public.quantities 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert quantities" 
ON public.quantities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update quantities" 
ON public.quantities 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);