/**
 * Unified API Service Layer
 * Consolidates all data operations with strict typing and consistent error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { logger, performanceTracker } from '@/utils/logger';
import { getYouTubeVideoId, getGoogleDriveFileId, isYouTubeUrl, isGoogleDriveUrl } from '@/utils/videoUtils';
import type { 
  Video, 
  VideoCreateData,
  VideoUpdateData 
} from '@/types';

// Strict API response type
interface ApiResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Video assignment interface
interface VideoAssignment {
  id: string;
  video_id: string;
  employee_id: string;
  assigned_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Employee with assignments interface
interface EmployeeWithAssignments {
  id: string;
  name: string;
  email: string;
  requiredProgress: number;
  completedVideos: number;
  totalVideos: number;
  status: 'completed' | 'on-track' | 'behind';
  assignments: VideoAssignment[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Generates thumbnail URL from video URL with proper fallback cascade
 */
const generateThumbnailUrl = (videoUrl: string | null): string | null => {
  if (!videoUrl) return null;
  
  try {
    // YouTube thumbnails - use multiple quality levels as fallbacks
    if (isYouTubeUrl(videoUrl)) {
      const videoId = getYouTubeVideoId(videoUrl);
      if (videoId) {
        // Return the highest quality that typically exists
        // We'll implement the fallback cascade in the TrainingCard component
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    // Google Drive thumbnails
    if (isGoogleDriveUrl(videoUrl)) {
      const fileId = getGoogleDriveFileId(videoUrl);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h600`;
      }
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to generate thumbnail URL', { videoUrl, error });
    return null;
  }
};
/**
 * Unified Video Operations
 */
export const videoOperations = {
  async getAll(includeArchived: boolean = false): Promise<ApiResult<Video[]>> {
    const operation = 'video.getAll';
    performanceTracker.start(operation);
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data: videos, error: videosError } = await query;

      if (videosError) {
        logger.error('Failed to fetch videos', undefined, { supabaseError: videosError.message });
        return { data: null, error: videosError.message, success: false };
      }

      const videosWithCounts = videos || [];

      logger.info('Videos fetched successfully', { count: videosWithCounts.length });
      return { data: videosWithCounts as Video[], error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching videos', error as Error);
      return { data: null, error: 'Failed to fetch videos', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getArchived(): Promise<ApiResult<Video[]>> {
    const operation = 'video.getHidden';
    performanceTracker.start(operation);
    
    try {
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch hidden videos', undefined, { supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Hidden videos fetched successfully', { count: videos?.length || 0 });
      return { data: (videos || []) as Video[], error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching hidden videos', error as Error);
      return { data: null, error: 'Failed to fetch hidden videos', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getById(id: string): Promise<ApiResult<Video>> {
    const operation = 'video.getById';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Failed to fetch video', undefined, { videoId: id, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video fetched successfully', { videoId: id });
      return { data: data as Video, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching video', error as Error, { videoId: id });
      return { data: null, error: 'Failed to fetch video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async create(videoData: VideoCreateData & { file?: File }): Promise<ApiResult<Video>> {
    const operation = 'video.create';
    performanceTracker.start(operation);
    
    try {
      let video_url = videoData.video_url;
      let video_file_name = videoData.video_file_name;
      
      // Handle file upload
      if (videoData.file) {
        const fileName = `${Date.now()}-${videoData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoData.file);

        if (uploadError) {
          logger.error('Failed to upload video file', undefined, { fileName, supabaseError: uploadError.message });
          return { data: null, error: 'Failed to upload video file', success: false };
        }

        video_file_name = fileName;
        video_url = null;
        
        logger.info('Video file uploaded successfully', { fileName });
      }

      // Generate thumbnail URL from video URL if available
      const thumbnailUrl = generateThumbnailUrl(video_url);

      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: videoData.title,
          description: videoData.description,
          video_url,
          video_file_name,
          thumbnail_url: thumbnailUrl,
          type: videoData.type,
          content_type: videoData.content_type || 'video',
          duration_seconds: videoData.duration_seconds || 0,
          completion_rate: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create video', undefined, { title: videoData.title, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video created successfully', { videoId: data.id, title: data.title });
      return { data: data as Video, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error creating video', error as Error, { title: videoData.title });
      return { data: null, error: 'Failed to create video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async update(id: string, updates: VideoUpdateData): Promise<ApiResult<Video>> {
    const operation = 'video.update';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .update({
          title: updates.title,
          description: updates.description,
          ...(updates.type && { type: updates.type }),
          ...(updates.content_type && { content_type: updates.content_type }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update video', undefined, { videoId: id, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video updated successfully', { videoId: id, title: updates.title });
      return { data: data as Video, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error updating video', error as Error, { videoId: id });
      return { data: null, error: 'Failed to update video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async checkUsage(id: string): Promise<ApiResult<{ canDelete: boolean; assignedCount: number; completedCount: number; quizCompletedCount: number }>> {
    const operation = 'video.checkUsage';
    performanceTracker.start(operation);
    
    try {
      // Use direct queries instead of RPC for now to avoid TypeScript issues
      const [assignedData, completedData, quizData] = await Promise.all([
        supabase.from('video_assignments').select('employee_id').eq('video_id', id),
        supabase.from('video_progress').select('employee_id').eq('video_id', id).not('completed_at', 'is', null),
        supabase.from('quizzes').select('id').eq('video_id', id).then(async (quizResult) => {
          if (quizResult.data && quizResult.data.length > 0) {
            return supabase.from('quiz_attempts').select('employee_id').eq('quiz_id', quizResult.data[0].id);
          }
          return { data: [], error: null };
        })
      ]);

      const assignedCount = assignedData.data?.length || 0;
      const completedCount = completedData.data?.length || 0;
      const quizCompletedCount = quizData.data?.length || 0;
      const canDelete = assignedCount === 0;

      return { 
        data: { canDelete, assignedCount, completedCount, quizCompletedCount }, 
        error: null, 
        success: true 
      };
    } catch (error) {
      logger.error('Unexpected error checking video usage', error as Error, { videoId: id });
      return { data: null, error: 'Failed to check video usage', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async delete(id: string): Promise<ApiResult<boolean>> {
    const operation = 'video.delete';
    performanceTracker.start(operation);
    
    try {
      // Check usage before allowing deletion
      const usageResult = await this.checkUsage(id);
      if (!usageResult.success || !usageResult.data?.canDelete) {
        const message = 'Cannot delete video: it has been assigned or completed by users';
        logger.warn('Video deletion blocked due to usage', { videoId: id, usage: usageResult.data });
        return { data: null, error: message, success: false };
      }

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete video', undefined, { videoId: id, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video deleted successfully', { videoId: id });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error deleting video', error as Error, { videoId: id });
      return { data: null, error: 'Failed to delete video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async archive(id: string): Promise<ApiResult<boolean>> {
    const operation = 'video.hide';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('videos')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error('Failed to hide video', undefined, { videoId: id, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video hidden successfully', { videoId: id });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error hiding video', error as Error, { videoId: id });
      return { data: null, error: 'Failed to hide video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async unarchive(id: string): Promise<ApiResult<boolean>> {
    const operation = 'video.show';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('videos')
        .update({ archived_at: null })
        .eq('id', id);

      if (error) {
        logger.error('Failed to show video', undefined, { videoId: id, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Video shown successfully', { videoId: id });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error showing video', error as Error, { videoId: id });
      return { data: null, error: 'Failed to show video', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  // ============ SEMANTIC WRAPPER METHODS FOR HIDE/SHOW ============
  // These methods use archived_at column for visibility control
  
  /**
   * Hides a video from the main list (uses archived_at column)
   */
  async hide(id: string): Promise<ApiResult<boolean>> {
    return this.archive(id);
  },

  /**
   * Shows a hidden video in the main list (clears archived_at column)
   */
  async show(id: string): Promise<ApiResult<boolean>> {
    return this.unarchive(id);
  },

  /**
   * Gets all hidden videos (queries videos with archived_at set)
   */
  async getHidden(): Promise<ApiResult<Video[]>> {
    return this.getArchived();
  }
};

/**
 * Unified Employee Operations
 */
export const employeeOperations = {
  async getAll(): Promise<ApiResult<EmployeeWithAssignments[]>> {
    const operation = 'employee.getAll';
    performanceTracker.start(operation);
    
    try {
      // Use the database function to get all employees with assignments
      const { data: employeeAssignments, error } = await supabase
        .rpc('get_all_employee_assignments');

      if (error) {
        logger.error('Failed to fetch employees with assignments', undefined, { supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      const result: (EmployeeWithAssignments & { is_admin?: boolean })[] = employeeAssignments?.map((emp: any) => {
        const assignments = Array.isArray(emp.assignments) ? emp.assignments.filter((a: any) => a != null) : [];
        const completedVideos = assignments.filter((a: any) => a.progress_percent === 100).length;
        const totalVideos = assignments.length;
        
        return {
          id: emp.employee_id,
          name: emp.employee_full_name || emp.employee_email?.split('@')[0] || 'Unknown',
          email: emp.employee_email || '',
          is_admin: emp.is_admin || false,
          requiredProgress: 0,
          completedVideos,
          totalVideos,
          status: employeeOperations.calculateStatus(completedVideos, totalVideos),
          assignments,
          created_at: emp.created_at,
          updated_at: emp.updated_at
        };
      }) || [];

      logger.info('Employees with assignments fetched successfully', { count: result.length });
      return { data: result, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching employees with assignments', error as Error);
      return { data: null, error: 'Failed to fetch employees', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  calculateStatus(completedVideos: number, totalVideos: number): 'completed' | 'on-track' | 'behind' {
    if (totalVideos === 0) return 'on-track';
    const progressPercent = (completedVideos / totalVideos) * 100;
    
    if (progressPercent === 100) return 'completed';
    if (progressPercent >= 75) return 'on-track';
    return 'behind';
  },

  async add(email: string, fullName?: string): Promise<ApiResult<EmployeeWithAssignments>> {
    const operation = 'employee.add';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          email: email.toLowerCase(),
          full_name: fullName || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add employee', undefined, { email, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      const employeeWithAssignments: EmployeeWithAssignments = {
        id: data.id,
        name: data.full_name || data.email?.split('@')[0] || 'Unknown',
        email: data.email || '',
        requiredProgress: 0,
        completedVideos: 0,
        totalVideos: 0,
        status: 'behind',
        assignments: [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      logger.info('Employee added successfully', { employeeId: data.id, email });
      return { data: employeeWithAssignments, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error adding employee', error as Error, { email });
      return { data: null, error: 'Failed to add employee', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async delete(employeeId: string): Promise<ApiResult<boolean>> {
    const operation = 'employee.delete';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        logger.error('Failed to delete employee', undefined, { employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Employee deleted successfully', { employeeId });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error deleting employee', error as Error, { employeeId });
      return { data: null, error: 'Failed to delete employee', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getHidden(): Promise<ApiResult<EmployeeWithAssignments[]>> {
    const operation = 'employee.getHidden';
    performanceTracker.start(operation);
    
    try {
      const { data: employeeAssignments, error } = await supabase
        .rpc('get_hidden_employee_assignments');

      if (error) {
        logger.error('Failed to fetch hidden employees', undefined, { supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      const result: (EmployeeWithAssignments & { is_admin?: boolean })[] = employeeAssignments?.map((emp: any) => {
        const assignments = Array.isArray(emp.assignments) ? emp.assignments.filter((a: any) => a != null) : [];
        const completedVideos = assignments.filter((a: any) => a.progress_percent === 100).length;
        const totalVideos = assignments.length;
        
        return {
          id: emp.employee_id,
          name: emp.employee_full_name || emp.employee_email?.split('@')[0] || 'Unknown',
          email: emp.employee_email || '',
          is_admin: emp.is_admin || false,
          requiredProgress: 0,
          completedVideos,
          totalVideos,
          status: employeeOperations.calculateStatus(completedVideos, totalVideos),
          assignments,
          created_at: emp.created_at,
          updated_at: emp.updated_at,
          archived_at: emp.archived_at
        };
      }) || [];

      logger.info('Hidden employees fetched successfully', { count: result.length });
      return { data: result, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching hidden employees', error as Error);
      return { data: null, error: 'Failed to fetch hidden employees', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async archive(employeeId: string): Promise<ApiResult<boolean>> {
    const operation = 'employee.hide';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', employeeId);

      if (error) {
        logger.error('Failed to hide employee', undefined, { employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Employee hidden successfully', { employeeId });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error hiding employee', error as Error, { employeeId });
      return { data: null, error: 'Failed to hide employee', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async unarchive(employeeId: string): Promise<ApiResult<boolean>> {
    const operation = 'employee.show';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ archived_at: null })
        .eq('id', employeeId);

      if (error) {
        logger.error('Failed to show employee', undefined, { employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Employee shown successfully', { employeeId });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error showing employee', error as Error, { employeeId });
      return { data: null, error: 'Failed to show employee', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  // ============ SEMANTIC WRAPPER METHODS FOR HIDE/SHOW ============
  
  /**
   * Hides an employee from the main list (uses archived_at column)
   */
  async hide(employeeId: string): Promise<ApiResult<boolean>> {
    return this.archive(employeeId);
  },

  /**
   * Shows a hidden employee in the main list (clears archived_at column)
   */
  async show(employeeId: string): Promise<ApiResult<boolean>> {
    return this.unarchive(employeeId);
  }
};

/**
 * Unified Assignment Operations  
 */
export const assignmentOperations = {
  async getByEmployee(employeeId: string): Promise<ApiResult<VideoAssignment[]>> {
    const operation = 'assignment.getByEmployee';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('video_assignments')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) {
        logger.error('Failed to fetch employee assignments', undefined, { employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Employee assignments fetched', { employeeId, count: data?.length || 0 });
      return { data: data as VideoAssignment[], error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching assignments', error as Error, { employeeId });
      return { data: null, error: 'Failed to fetch assignments', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getByEmployeeEmail(email: string): Promise<ApiResult<{ video: Video; assignment: VideoAssignment }[]>> {
    const operation = 'assignment.getByEmployeeEmail';
    performanceTracker.start(operation);
    
    try {
      const { data: assignments, error } = await supabase
        .rpc('get_user_video_assignments', { user_email: email });

      if (error) {
        logger.error('Failed to fetch assignments by email (RPC)', undefined, { email, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      // Type-safe processing of RPC result
      const result = Array.isArray(assignments)
        ? assignments.map((row: any) => {
            const video = row.video as Video;
            const a = row.assignment || {};
            return {
              video,
              assignment: {
                id: a.assignment_id || a.id,
                video_id: video.id,
                employee_id: a.employee_id || '',
                assigned_by: a.assigned_by || '',
                due_date: a.due_date || null,
                created_at: a.assigned_at || a.created_at || new Date().toISOString(),
                updated_at: a.updated_at || a.assigned_at || a.created_at || new Date().toISOString(),
                // Include progress fields used by the dashboard
                progress_percent: typeof a.progress_percent === 'number' ? a.progress_percent : 0,
                completed_at: a.completed_at || null,
              } as any,
            };
          })
        : [];


      logger.info('Assignments fetched by email', { email, count: result.length });
      return { data: result, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching assignments by email', error as Error, { email });
      return { data: null, error: 'Failed to fetch assignments', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async create(
    videoId: string,
    employeeId: string,
    assignedBy: string,
    dueDate?: Date
  ): Promise<ApiResult<VideoAssignment>> {
    const operation = 'assignment.create';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('video_assignments')
        .insert({
          video_id: videoId,
          employee_id: employeeId,
          assigned_by: assignedBy,
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create assignment', undefined, { videoId, employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Assignment created successfully', { videoId, employeeId });
      return { data: data as VideoAssignment, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error creating assignment', error as Error, { videoId, employeeId });
      return { data: null, error: 'Failed to create assignment', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async update(
    assignmentId: string,
    updates: { due_date?: Date | null }
  ): Promise<ApiResult<VideoAssignment>> {
    const operation = 'assignment.update';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('video_assignments')
        .update({
          due_date: updates.due_date ? updates.due_date.toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update assignment', undefined, { assignmentId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Assignment updated successfully', { assignmentId });
      return { data: data as VideoAssignment, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error updating assignment', error as Error, { assignmentId });
      return { data: null, error: 'Failed to update assignment', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async delete(assignmentId: string): Promise<ApiResult<boolean>> {
    const operation = 'assignment.delete';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase
        .from('video_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        logger.error('Failed to delete assignment', undefined, { assignmentId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Assignment deleted successfully', { assignmentId });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error deleting assignment', error as Error, { assignmentId });
      return { data: null, error: 'Failed to delete assignment', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  /**
   * Batch create assignments for multiple employees (efficient single insert)
   * Used by "Assign to all employees" feature
   */
  async createBatch(
    assignments: Array<{
      video_id: string;
      employee_id: string;
      assigned_by: string;
      due_date?: Date;
    }>
  ): Promise<ApiResult<VideoAssignment[]>> {
    const operation = 'assignment.createBatch';
    performanceTracker.start(operation);
    
    try {
      if (assignments.length === 0) {
        return { data: [], error: null, success: true };
      }

      const insertData = assignments.map(a => ({
        video_id: a.video_id,
        employee_id: a.employee_id,
        assigned_by: a.assigned_by,
        due_date: a.due_date ? a.due_date.toISOString().split('T')[0] : null,
      }));

      const { data, error } = await supabase
        .from('video_assignments')
        .insert(insertData)
        .select();

      if (error) {
        logger.error('Failed to batch create assignments', undefined, { 
          count: assignments.length, 
          supabaseError: error.message 
        });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Batch assignments created successfully', { count: data?.length || 0 });
      return { data: data as VideoAssignment[], error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error batch creating assignments', error as Error, { 
    count: assignments.length 
      });
      return { data: null, error: 'Failed to create assignments', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  /**
   * Send email notification for a training assignment (fire-and-forget safe)
   */
  async sendNotification(params: {
    employee_email: string;
    employee_name: string;
    training_titles: string[];
    due_date: string;
    app_url: string;
  }): Promise<ApiResult<boolean>> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-training-notification',
        { body: params }
      );

      if (error) {
        logger.error('Failed to send training notification', undefined, {
          employee_email: params.employee_email,
          training_titles: params.training_titles,
          supabaseError: error.message,
        });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Training notification sent', {
        employee_email: params.employee_email,
        training_titles: params.training_titles,
      });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error sending notification', error as Error, {
    employee_email: params.employee_email,
      });
      return { data: null, error: 'Failed to send notification', success: false };
    }
  },

  /**
   * Send email notification for admin status change (fire-and-forget safe)
   */
  async sendAdminStatusNotification(params: {
    employee_email: string;
    employee_name: string;
    granted: boolean;
    app_url: string;
  }): Promise<ApiResult<boolean>> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-training-notification',
        { body: { type: 'admin_status_change', ...params } }
      );

      if (error) {
        logger.error('Failed to send admin status notification', undefined, {
          employee_email: params.employee_email,
          granted: params.granted,
          supabaseError: error.message,
        });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Admin status notification sent', {
        employee_email: params.employee_email,
        granted: params.granted,
      });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error sending admin status notification', error as Error, {
        employee_email: params.employee_email,
      });
      return { data: null, error: 'Failed to send notification', success: false };
    }
  }
};

/**
 * Unified Progress Operations
 */
export const progressOperations = {
  async update(
    employeeId: string, 
    videoId: string, 
    progressPercent: number, 
    completedAt?: Date
  ): Promise<ApiResult<boolean>> {
    const operation = 'progress.update';
    performanceTracker.start(operation);
    
    try {
      // Build update object - only include completed_at if explicitly provided
      const updateData: any = {
        employee_id: employeeId,
        video_id: videoId,
        progress_percent: Math.max(0, Math.min(100, progressPercent)),
        updated_at: new Date().toISOString()
      };

      // Only update completed_at if explicitly provided to prevent accidental nullification
      if (completedAt !== undefined) {
        updateData.completed_at = completedAt?.toISOString() || null;
      }

      const { error } = await supabase
        .from('video_progress')
        .upsert(updateData, {
          onConflict: 'employee_id,video_id'
        });

      if (error) {
        logger.error('Failed to update progress', undefined, { 
          employeeId, 
          videoId, 
          progressPercent, 
          supabaseError: error.message 
        });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Progress updated successfully', { employeeId, videoId, progressPercent });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error updating progress', error as Error, { 
        employeeId, 
        videoId 
      });
      return { data: null, error: 'Failed to update progress', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getByEmployee(employeeId: string): Promise<ApiResult<{ video_id: string; progress_percent: number; completed_at: string | null }[]>> {
    const operation = 'progress.getByEmployee';
    performanceTracker.start(operation);
    
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('video_id, progress_percent, completed_at')
        .eq('employee_id', employeeId);

      if (error) {
        logger.error('Failed to fetch employee progress', undefined, { employeeId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Employee progress fetched', { employeeId, count: data?.length || 0 });
      return { data: data as { video_id: string; progress_percent: number; completed_at: string | null }[], error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching employee progress', error as Error, { employeeId });
      return { data: null, error: 'Failed to fetch employee progress', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async updateByEmail(
    email: string,
    videoId: string,
    progressPercent: number,
    completedAt?: Date,
    presentationAcknowledgedAt?: Date,
    acknowledgmentViewingSeconds?: number
  ): Promise<ApiResult<boolean>> {
    const operation = 'progress.updateByEmail';
    performanceTracker.start(operation);
    
    try {
      const { error } = await supabase.rpc('update_video_progress_by_email', {
        p_email: email.toLowerCase(),
        p_video_id: videoId,
        p_progress_percent: Math.max(0, Math.min(100, progressPercent)),
        p_completed_at: completedAt?.toISOString() || null,
        p_presentation_acknowledged_at: presentationAcknowledgedAt?.toISOString() || null,
        p_acknowledgment_viewing_seconds: acknowledgmentViewingSeconds || null
      });

      if (error) {
        logger.error('Failed to update progress by email', undefined, {
          email,
          videoId,
          supabaseError: error.message
        });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Progress updated by email successfully', {
        email,
        videoId,
        progressPercent,
        presentationAcknowledged: !!presentationAcknowledgedAt
      });
      return { data: true, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error updating progress by email', error as Error, { email, videoId });
      return { data: null, error: 'Failed to update progress', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  },

  async getByEmailAndVideo(
    email: string,
    videoId: string
  ): Promise<ApiResult<{ progress_percent: number; completed_at: string | null; acknowledgment_viewing_seconds: number | null } | null>> {
    const operation = 'progress.getByEmailAndVideo';
    performanceTracker.start(operation);
    try {
      // Lookup employee by email with better error handling
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (empError) {
        logger.error('Database error looking up employee for progress', undefined, { email, supabaseError: empError.message });
        return { data: null, error: 'Database error', success: false };
      }

      if (!employees || employees.length === 0) {
        logger.warn('Employee not found when fetching progress', { email, normalizedEmail: email.toLowerCase() });
        return { data: null, error: null, success: true };
      }

      const employee = employees[0];
      logger.info('Employee found for progress fetch', { email, employeeId: employee.id });

      const { data, error } = await supabase
        .from('video_progress')
        .select('progress_percent, completed_at, acknowledgment_viewing_seconds')
        .eq('employee_id', employee.id)
        .eq('video_id', videoId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch progress', undefined, { email, videoId, supabaseError: error.message });
        return { data: null, error: error.message, success: false };
      }

      logger.info('Progress fetched successfully', { email, videoId, hasData: !!data });
      return { data: (data as any) || null, error: null, success: true };
    } catch (error) {
      logger.error('Unexpected error fetching progress by email', error as Error, { email, videoId });
      return { data: null, error: 'Failed to fetch progress', success: false };
    } finally {
      performanceTracker.end(operation);
    }
  }
};