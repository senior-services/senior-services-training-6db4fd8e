import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export class AdminService {
  /**
   * Get all admin users by joining profiles with user_roles
   */
  static async getAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Add admin role to a user by email
   */
  static async addAdminByEmail(email: string): Promise<void> {
    // First, check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new Error('User not found. The user must sign up first before being made an admin.');
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      throw new Error('User is already an admin.');
    }

    // Add admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: profile.user_id,
        role: 'admin'
      });

    if (insertError) {
      console.error('Error adding admin role:', insertError);
      throw insertError;
    }
  }

  /**
   * Remove admin role from a user
   */
  static async removeAdminRole(userId: string): Promise<void> {
    // Check if this is the last admin
    const { data: adminCount, error: countError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin');

    if (countError) {
      console.error('Error checking admin count:', countError);
      throw countError;
    }

    if (adminCount && adminCount.length <= 1) {
      throw new Error('Cannot remove the last admin. There must be at least one admin.');
    }

    // Remove admin role
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) {
      console.error('Error removing admin role:', error);
      throw error;
    }
  }
}