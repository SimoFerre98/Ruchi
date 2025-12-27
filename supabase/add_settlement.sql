-- Add is_settlement column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN is_settlement boolean DEFAULT false;
