import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: 'Authentication Error',
            description: error.message,
            variant: 'destructive'
          });
          navigate('/auth');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          const email = user.email;

          if (email) {
            // Check if this email was pre-approved for admin access
            const isPending = await AdminService.isPendingAdmin(email);
            
            if (isPending) {
              // Use the new promote function to handle role assignment properly
              try {
                await supabase.rpc('promote_user_to_admin', { 
                  p_user_id: user.id, 
                  p_email: email 
                });
                
                toast({
                  title: 'Welcome, Administrator!',
                  description: 'You have been granted admin access.',
                });
                
                navigate('/dashboard');
                return;
              } catch (adminError) {
                console.error('Error granting admin access:', adminError);
              }
            }

            // Check if user already has admin role
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();

            if (roleData) {
              navigate('/dashboard');
            } else {
              navigate('/employee');
            }
          } else {
            navigate('/employee');
          }
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong during authentication',
          variant: 'destructive'
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Completing authentication...</span>
      </div>
    </div>
  );
};