-- Update John Doe's full name in the employees table
UPDATE employees 
SET full_name = 'John Doe', updated_at = now()
WHERE email = 'john.doe@southsoundseniors.org' AND full_name IS NULL;