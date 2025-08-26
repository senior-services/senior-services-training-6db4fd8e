-- Allow admins to delete roles from user_roles
CREATE POLICY IF NOT EXISTS "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));