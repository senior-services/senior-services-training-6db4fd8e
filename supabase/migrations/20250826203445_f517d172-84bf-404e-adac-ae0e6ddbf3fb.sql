-- Manually add the existing user to employees table since they were missed
INSERT INTO public.employees (email, full_name)
VALUES ('jeri.vibe.test@gmail.com', 'Jeri')
ON CONFLICT (email) DO NOTHING;