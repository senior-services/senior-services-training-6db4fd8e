import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export class AdminService {
  /**
   * Get all admin users by manually joining the data
   */
  static async getAdmins(): Promise<AdminUser[]> {
    // First get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      return [];
    }

    // Get admin user IDs
    const adminUserIds = adminRoles.map(role => role.user_id);

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, created_at')
      .in('user_id', adminUserIds)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching admin profiles:', profilesError);
      throw profilesError;
    }

    // Map the data to match our interface
    return (profiles || []).map(profile => ({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      created_at: profile.created_at
    }));
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
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('User not found. The user must sign up first before being made an admin.');
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('role', 'admin')
      .maybeSingle();

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