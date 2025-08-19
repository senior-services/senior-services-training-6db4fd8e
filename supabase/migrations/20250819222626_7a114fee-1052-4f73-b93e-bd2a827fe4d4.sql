-- Remove white-label/generic functionality from database

-- Remove is_generic column from employees table
ALTER TABLE public.employees DROP COLUMN IF EXISTS is_generic;

-- Drop the employee_assignments_with_videos view if it exists (it has is_generic_assignment)
DROP VIEW IF EXISTS public.employee_assignments_with_videos;