import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { logger } from '@/utils/logger';
import { clearUserRoleCache } from '@/services/quizService';
import { APP_CONFIG } from '@/constants';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

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

// Helper function to get user-friendly error message
function getAuthErrorMessage(error: any): string {
  if (isCompanyEmailError(error)) {
    return `Only @southsoundseniors.org email addresses are allowed. Need access? Contact ${APP_CONFIG.supportEmail}`;
  }
  
  // Handle other common auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link to verify your account.';
  }
  
  return error.message || 'Authentication failed. Please try again.';
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Error getting session', error as Error);
      }
      
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        const userMessage = getAuthErrorMessage(error);
        logger.error('Google sign in error', error as Error);
        toast.error(userMessage);
      }
    } catch (error) {
      logger.error('Google sign in error', error as Error);
      toast.error('Failed to sign in with Google');
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        const userMessage = getAuthErrorMessage(error);
        logger.error('Sign up error', error as Error);
        toast.error(userMessage);
        return { error };
      }

      toast.success('Check your email for confirmation link');
      return { error: null };
    } catch (error) {
      logger.error('Sign up error', error as Error);
      toast.error('Failed to sign up');
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const userMessage = getAuthErrorMessage(error);
        logger.error('Sign in error', error as Error);
        toast.error(userMessage);
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Sign in error', error as Error);
      toast.error('Failed to sign in');
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out error', error as Error);
      }
      
      // Clear local state
      setState({
        session: null,
        user: null,
        loading: false,
      });
      
      // Clear role cache
      clearUserRoleCache();
      
      if (!error) {
        toast.success('Successfully signed out');
      }
    } catch (error) {
      logger.error('Sign out error', error as Error);
      
      // Clear local state regardless
      setState({
        session: null,
        user: null,
        loading: false,
      });
      
      clearUserRoleCache();
    }
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    signInWithGoogle,
    signUp,
    signIn,
    signOut,
  };
}