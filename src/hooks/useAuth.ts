import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    // Check for existing session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setState({
          session,
          user: session?.user ?? null,
          loading: false,
        });
        
        initialSessionHandled = true;
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setState({
            session: null,
            user: null,
            loading: false,
          });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Skip INITIAL_SESSION if we already handled it
        if (event === 'INITIAL_SESSION' && initialSessionHandled) {
          return;
        }
        
        setState({
          session,
          user: session?.user ?? null,
          loading: false,
        });

        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out');
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
        console.error('Google sign in error:', error);
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
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
        console.error('Sign up error:', error);
        toast.error(error.message || 'Failed to sign up');
        return { error };
      }

      toast.success('Check your email for confirmation link');
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
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
        console.error('Sign in error:', error);
        toast.error(error.message || 'Failed to sign in');
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in');
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // If there's a session_not_found error, we should still consider it a successful logout
      // because the user is effectively logged out already
      const isSessionError = error && (
        error.message?.includes('session_not_found') || 
        error.message?.includes('Session not found') ||
        error.message?.includes('Session from session_id claim in JWT does not exist') ||
        (error as any).__isAuthError
      );
      
      if (error && !isSessionError) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out');
        return;
      }
      
      // Clear local state immediately for better UX
      setState({
        session: null,
        user: null,
        loading: false,
      });
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Check if it's a session-related error (AuthSessionMissingError, etc.)
      const isSessionError = 
        error.name === 'AuthSessionMissingError' ||
        error.message?.includes('Auth session missing') ||
        error.message?.includes('session_not_found') ||
        error.message?.includes('Session not found') ||
        error.message?.includes('Session from session_id claim in JWT does not exist');
      
      // Clear local state regardless - user should appear logged out
      setState({
        session: null,
        user: null,
        loading: false,
      });
      
      // Only show error toast if it's not a session-related error
      if (!isSessionError) {
        toast.error('Failed to sign out');
      }
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