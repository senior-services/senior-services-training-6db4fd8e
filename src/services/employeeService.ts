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
        video_assignments(count)
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
        full_name: fullName
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }


  // Assign video to employee (optionally with due date)
  static async assignVideoToEmployee(videoId: string, employeeId: string, dueDate?: Date | string): Promise<VideoAssignment> {
    // Normalize date to YYYY-MM-DD for Postgres DATE column
    const normalizedDueDate = dueDate
      ? (dueDate instanceof Date
          ? dueDate.toISOString().slice(0, 10)
          : new Date(dueDate).toISOString().slice(0, 10))
      : null;

    const { data, error } = await supabase
      .from('video_assignments')
      .insert({
        video_id: videoId,
        employee_id: employeeId,
        due_date: normalizedDueDate,
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

  // Set or clear due date for an assignment
  static async setAssignmentDueDate(videoId: string, employeeId: string, dueDate: Date | null): Promise<void> {
    const normalizedDueDate = dueDate ? dueDate.toISOString().slice(0, 10) : null;
    const { error } = await supabase
      .from('video_assignments')
      .update({ due_date: normalizedDueDate })
      .eq('video_id', videoId)
      .eq('employee_id', employeeId);

    if (error) throw error;
  }

  // Get employee assignments with video details
  static async getEmployeeAssignments(employeeId: string): Promise<any[]> {
    const { data: assignments, error: assignmentError } = await supabase
      .from('video_assignments')
      .select(`
        *,
        videos (*)
      `)
      .eq('employee_id', employeeId);

    if (assignmentError) throw assignmentError;
    
    return assignments?.map(assignment => ({
      assignment_id: assignment.id,
      video_id: assignment.video_id,
      video_title: assignment.videos?.title,
      video_description: assignment.videos?.description,
      video_url: assignment.videos?.video_url,
      thumbnail_url: assignment.videos?.thumbnail_url,
      video_type: assignment.videos?.type,
      assigned_at: assignment.created_at,
      assigned_by: assignment.assigned_by,
      due_date: assignment.due_date,
      employee_id: employeeId
    })) || [];
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
  static async getAssignedVideosByEmail(email: string): Promise<{ video: Video; assignment: any }[]> {
    // First find the employee by email
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('email', email)
      .single();

    if (employeeError || !employee) {
      return [];
    }

    // Get videos assigned to this employee with assignment details
    const { data: assignments, error: assignmentError } = await supabase
      .from('video_assignments')
      .select(`
        *,
        videos (*)
      `)
      .eq('employee_id', employee.id);

    if (assignmentError) {
      return [];
    }

    // Return videos with their assignment data
    return assignments?.map(assignment => ({
      video: {
        id: assignment.videos?.id || '',
        title: assignment.videos?.title || '',
        description: assignment.videos?.description || '',
        video_url: assignment.videos?.video_url || '',
        thumbnail_url: assignment.videos?.thumbnail_url || '',
        type: assignment.videos?.type as VideoType || 'Optional',
        created_at: assignment.videos?.created_at || '',
        updated_at: assignment.videos?.updated_at || '',
        assigned_to: assignment.videos?.assigned_to || 0,
        completion_rate: assignment.videos?.completion_rate || 0,
        video_file_name: assignment.videos?.video_file_name || null,
        has_quiz: assignment.videos?.has_quiz || false
      },
      assignment: {
        due_date: assignment.due_date,
        assigned_at: assignment.created_at,
        assignment_id: assignment.id
      }
    })).filter(item => item.video.id) || [];
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

  static async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        throw error;
      }

      return {
        ...data,
        type: data.type as VideoType
      };
    } catch (error) {
      console.error('Error in getVideoById:', error);
      throw error;
    }
  }
}