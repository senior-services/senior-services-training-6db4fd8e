import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { AdminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { Button } from '@/components/ui/button';
import { withRetry } from '@/utils/errorHandler';
import { APP_CONFIG } from '@/constants';

// Helper function to detect company email restriction errors
function isCompanyEmailError(error: any): boolean {
  if (!error || !error.message) return false;
  
  const message = error.message.toLowerCase();
  
  // Check for direct database constraint violations (Postgres error codes 23xxx series)
  if (error.code && error.code.toString().startsWith('23')) {
    return true;
  }
  
  // Check for specific error messages from the database trigger
  return message.includes('company email') || 
         message.includes('domain') || 
         message.includes('southsoundseniors.org') ||
         message.includes('organization email') ||
         message.includes('only company email addresses are allowed') ||
         message.includes('email domain not allowed') ||
         message.includes('violates row-level security') ||
         message.includes('new row violates');
}

const AuthCallbackContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Use retry mechanism for transient failures
        const sessionResult = await withRetry(
          async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data;
          },
          3, // max retries
          1000, // initial delay
          1.5 // backoff multiplier
        );
        
        const { session } = sessionResult;
        
        if (!session?.user) {
          // Check URL params for OAuth errors
          const urlParams = new URLSearchParams(window.location.search);
          const errorParam = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (errorParam || errorDescription) {
            const errorMsg = errorDescription || errorParam || 'Authentication failed';
            
            if (isCompanyEmailError({ message: errorMsg })) {
              toast({
                title: 'Company Email Required',
                description: `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`,
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Authentication Error',
                description: errorMsg,
                variant: 'destructive'
              });
            }
          } else {
            toast({
              title: 'Authentication Required',
              description: 'Please sign in to continue.',
              variant: 'destructive'
            });
          }
          
          navigate('/auth');
          return;
        }

        const user = session.user;
        const email = user.email;

        if (email) {
          try {
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
                logger.error('Error granting admin access', adminError as Error);
                
                // Check if this is a company email error from the database
                if (isCompanyEmailError(adminError)) {
                  toast({
                    title: 'Company Email Required',
                    description: `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`,
                    variant: 'destructive'
                  });
                  navigate('/auth');
                  return;
                }
              }
            }

            // Check if user already has admin role
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();

            if (roleError) {
              logger.error('Error checking user role', roleError as Error);
              
              // Check if this is a company email error from the database
              if (isCompanyEmailError(roleError)) {
                toast({
                  title: 'Company Email Required',
                  description: `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`,
                  variant: 'destructive'
                });
                navigate('/auth');
                return;
              }
              
              // For other errors, still try to navigate to employee dashboard
              navigate('/employee');
              return;
            }

            if (roleData) {
              navigate('/dashboard');
            } else {
              navigate('/employee');
            }
          } catch (dbError) {
            logger.error('Database operation error during auth callback', dbError as Error);
            
            // Check if this is a company email error from the database
            if (isCompanyEmailError(dbError)) {
              toast({
                title: 'Company Email Required',
                description: `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`,
                variant: 'destructive'
              });
              navigate('/auth');
              return;
            }
            
            // For other database errors, still try to navigate
            navigate('/employee');
          }
        } else {
          navigate('/employee');
        }
      } catch (error) {
        logger.error('Callback handling error', error as Error);
        
        // Check if this is a company email error
        if (isCompanyEmailError(error)) {
          toast({
            title: 'Company Email Required',
            description: `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Authentication Error',
            description: 'Something went wrong during authentication. Please try again.',
            variant: 'destructive'
          });
        }
        
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast, retryCount]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    // Reset after a short delay to allow loading state
    setTimeout(() => {
      setIsRetrying(false);
    }, 500);
  };

  if (retryCount > 0 && !isRetrying) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div 
          className="text-center space-y-4"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="w-12 h-12 text-attention mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Authentication Taking Longer Than Expected
            </h2>
            <p className="text-white/80 mb-4">
              There may be an issue with your authentication. Would you like to try again?
            </p>
            <Button 
              onClick={handleRetry}
              className="bg-card text-foreground hover:bg-muted"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div 
        className="flex items-center space-x-3 text-white"
        role="status"
        aria-live="polite"
        aria-label="Authentication in progress"
      >
        <Loader2 
          className="w-6 h-6 animate-spin" 
          aria-hidden="true"
        />
        <div>
          <span className="text-lg">Completing authentication...</span>
          <div className="text-sm text-white/70 mt-1">
            Please wait while we verify your credentials
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with error boundary
export const AuthCallback = () => (
  <AuthErrorBoundary>
    <AuthCallbackContent />
  </AuthErrorBoundary>
);