INSERT INTO public.user_roles (user_id, role)
VALUES ('b8f92745-f8c0-48ab-a22b-86aa6d39d604', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;