import { supabase } from '@/integrations/supabase/client';
import type { Employee, VideoAssignment, EmployeeWithAssignments } from '@/types/employee';
import type { Video, VideoType } from '@/types';

export class EmployeeService {
  
  // Get all employees with their assignment counts using optimized batch loading
  static async getEmployees(): Promise<EmployeeWithAssignments[]> {
    try {
      const { data: employeeBatch, error } = await supabase
        .rpc('get_all_employee_assignments');

      if (error) throw error;
      
      return employeeBatch?.map((emp: any) => ({
        id: emp.employee_id,
        email: emp.employee_email,
        full_name: emp.employee_full_name,
        created_at: '', // Will be populated by individual employee query if needed
        updated_at: '', // Will be populated by individual employee query if needed
        assigned_videos_count: Array.isArray(emp.assignments) ? emp.assignments.length : 0,
        assignments: emp.assignments || []
      })) || [];
    } catch (error) {
      console.error('Error in optimized getEmployees:', error);
      // Fallback to original method if new method fails
      return this.getEmployeesLegacy();
    }
  }

  // Legacy method as fallback
  private static async getEmployeesLegacy(): Promise<EmployeeWithAssignments[]> {
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
    console.log('getAssignedVideosByEmail called with email:', email);
    
    try {
      // Use the database function that includes progress data
      const { data: assignments, error } = await supabase
        .rpc('get_user_video_assignments', { user_email: email });

      console.log('RPC assignments result:', { assignments, error });

      if (error) {
        console.error('Error calling get_user_video_assignments:', error);
        return [];
      }

      // Transform the RPC result to match expected format
      const result = assignments?.map((assignment: any) => {
        const video = assignment.video as any;
        const assignmentData = assignment.assignment as any;
        
        return {
          video: {
            id: video.id,
            title: video.title || '',
            description: video.description || '',
            video_url: video.video_url || '',
            thumbnail_url: video.thumbnail_url || '',
            type: video.type as VideoType || 'Optional',
            created_at: video.created_at || '',
            updated_at: video.updated_at || '',
            assigned_to: video.assigned_to || 0,
            completion_rate: assignmentData.progress_percent || 0, // Use real progress from DB
            duration_seconds: video.duration_seconds || 0,
            video_file_name: video.video_file_name || null,
            has_quiz: video.has_quiz || false
          },
          assignment: {
            due_date: assignmentData.due_date,
            assigned_at: assignmentData.assigned_at,
            assignment_id: assignmentData.assignment_id,
            progress_percent: assignmentData.progress_percent || 0,
            completed_at: assignmentData.completed_at
          }
        };
      }) || [];
      
      console.log('Final result for getAssignedVideosByEmail:', result);
      return result;
      
    } catch (error) {
      console.error('Error in getAssignedVideosByEmail:', error);
      return [];
    }
  }

  // Update video progress for an employee
  static async updateVideoProgress(
    employeeId: string, 
    videoId: string, 
    progressPercent: number,
    completedAt?: Date
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_video_progress', {
          p_employee_id: employeeId,
          p_video_id: videoId,
          p_progress_percent: Math.max(0, Math.min(100, progressPercent)), // Ensure valid range
          p_completed_at: completedAt?.toISOString() || null
        });

      if (error) {
        console.error('Error updating video progress:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateVideoProgress:', error);
      throw error;
    }
  }

  // Update progress by employee email (for employee dashboard)
  static async updateVideoProgressByEmail(
    email: string, 
    videoId: string, 
    progressPercent: number,
    completedAt?: Date
  ): Promise<void> {
    try {
      // First get the employee ID from email
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single();

      if (employeeError || !employee) {
        console.error('Error finding employee by email:', employeeError);
        throw new Error('Employee not found');
      }

      await this.updateVideoProgress(employee.id, videoId, progressPercent, completedAt);
    } catch (error) {
      console.error('Error in updateVideoProgressByEmail:', error);
      throw error;
    }
  }

  // Get video progress by employee email
  static async getVideoProgressByEmail(email: string, videoId: string): Promise<{ progress_percent: number; completed_at?: string } | null> {
    try {
      // First get the employee ID from email
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single();

      if (employeeError || !employee) {
        return null;
      }

      // Get the video progress
      const { data: progress, error: progressError } = await supabase
        .from('video_progress')
        .select('progress_percent, completed_at')
        .eq('employee_id', employee.id)
        .eq('video_id', videoId)
        .single();

      if (progressError || !progress) {
        return null;
      }

      return progress;
    } catch (error) {
      console.error('Error in getVideoProgressByEmail:', error);
      return null;
    }
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