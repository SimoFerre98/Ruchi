-- Add category column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN category text DEFAULT 'Altro';

-- Update existing expenses (optional, they default to 'Altro')
-- UPDATE public.expenses SET category = 'Altro' WHERE category IS NULL;
