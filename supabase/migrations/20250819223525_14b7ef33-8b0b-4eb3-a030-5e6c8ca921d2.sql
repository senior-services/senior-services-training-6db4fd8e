-- Remove domain column from employees table
ALTER TABLE public.employees DROP COLUMN IF EXISTS domain CASCADE;