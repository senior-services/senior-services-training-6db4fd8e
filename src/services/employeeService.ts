import { supabase } from '@/integrations/supabase/client';
import type { Employee, VideoAssignment, EmployeeWithAssignments } from '@/types/employee';
import type { Video, VideoType } from '@/types';

export class EmployeeService {
  
  // Get all employees with their assignment counts
  static async getEmployees(): Promise<EmployeeWithAssignments[]> {
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        *,
        video_assignments!inner(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return employees?.map(emp => ({
      ...emp,
      assigned_videos_count: emp.video_assignments?.[0]?.count || 0
    })) || [];
  }

  // Add a new employee by email
  static async addEmployee(email: string, fullName?: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        email,
        full_name: fullName,
        is_generic: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get generic employee (for white-label assignments)
  static async getGenericEmployee(): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_generic', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Assign video to employee
  static async assignVideoToEmployee(videoId: string, employeeId: string): Promise<VideoAssignment> {
    const { data, error } = await supabase
      .from('video_assignments')
      .insert({
        video_id: videoId,
        employee_id: employeeId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Remove video assignment
  static async removeVideoAssignment(videoId: string, employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('video_assignments')
      .delete()
      .eq('video_id', videoId)
      .eq('employee_id', employeeId);

    if (error) throw error;
  }

  // Get employee assignments with video details
  static async getEmployeeAssignments(employeeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('employee_assignments_with_videos')
      .select('*')
      .eq('employee_id', employeeId);

    if (error) throw error;
    return data || [];
  }

  // Get videos assigned to a specific employee
  static async getAssignedVideos(employeeId: string): Promise<Video[]> {
    // First get the video IDs for this employee
    const { data: assignments, error: assignmentError } = await supabase
      .from('video_assignments')
      .select('video_id')
      .eq('employee_id', employeeId);

    if (assignmentError) throw assignmentError;

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const videoIds = assignments.map(a => a.video_id);

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (error) throw error;
    return (data || []).map(video => ({
      ...video,
      type: video.type as VideoType
    }));
  }

  // Get videos assigned to user by their email (for employee dashboard)
  static async getAssignedVideosByEmail(email: string): Promise<Video[]> {
    // Get videos assigned directly to the user
    const { data: directAssignments } = await supabase
      .from('employee_assignments_with_videos')
      .select('*')
      .eq('employee_email', email);

    // Get videos assigned to generic employee (white-label)
    const { data: genericAssignments } = await supabase
      .from('employee_assignments_with_videos')
      .select('*')
      .eq('is_generic_assignment', true);

    const allAssignments = [...(directAssignments || []), ...(genericAssignments || [])];
    
    // Extract unique videos
    const videoMap = new Map();
    allAssignments.forEach(assignment => {
      if (!videoMap.has(assignment.video_id)) {
        videoMap.set(assignment.video_id, {
          id: assignment.video_id,
          title: assignment.video_title,
          description: assignment.video_description,
          video_url: assignment.video_url,
          thumbnail_url: assignment.thumbnail_url,
          type: assignment.video_type as VideoType,
          created_at: assignment.assigned_at,
          updated_at: assignment.assigned_at,
          assigned_to: 0,
          completion_rate: 0,
          video_file_name: null,
          has_quiz: false
        });
      }
    });

    return Array.from(videoMap.values());
  }

  // Delete employee
  static async deleteEmployee(employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (error) throw error;
  }

  // Update employee
  static async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}