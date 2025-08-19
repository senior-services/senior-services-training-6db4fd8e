/**
 * Supabase service layer for centralized database operations
 * Provides secure, type-safe database interactions with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { Video, VideoCreateData, VideoUpdateData, Employee, TrainingProgress, Profile } from '@/types';
import { DB_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

// Generic API response type
interface ApiResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Video service operations
 */
export const videoService = {
  /**
   * Fetches all videos with error handling
   * @returns Promise with videos data or error
   */
  async getAll(): Promise<ApiResult<Video[]>> {
    try {
      // First get all videos
      const { data: videos, error: videosError } = await supabase
        .from(DB_CONFIG.TABLES.VIDEOS)
        .select('*')
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        return {
          data: null,
          error: videosError.message || ERROR_MESSAGES.VIDEO.LOAD_FAILED,
          success: false,
        };
      }

      // Get assignment counts for all videos
      const { data: assignmentCounts, error: countError } = await supabase
        .from('video_assignments')
        .select('video_id')
        .then(({ data, error }) => {
          if (error) return { data: null, error };
          
          // Count assignments per video
          const counts = new Map();
          data?.forEach(assignment => {
            counts.set(assignment.video_id, (counts.get(assignment.video_id) || 0) + 1);
          });
          
          return { data: counts, error: null };
        });

      if (countError) {
        console.error('Error fetching assignment counts:', countError);
        return {
          data: null,
          error: countError.message || ERROR_MESSAGES.VIDEO.LOAD_FAILED,
          success: false,
        };
      }

      // Update videos with actual assignment counts
      const videosWithCounts = videos?.map(video => ({
        ...video,
        assigned_to: assignmentCounts?.get(video.id) || 0
      })) || [];

      return {
        data: videosWithCounts as Video[],
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error fetching videos:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Fetches a single video by ID
   * @param id - Video ID
   * @returns Promise with video data or error
   */
  async getById(id: string): Promise<ApiResult<Video>> {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.VIDEOS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.NOT_FOUND,
          success: false,
        };
      }

      return {
        data: data as Video,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error fetching video:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Creates a new video with file upload support
   * @param videoData - Video creation data
   * @returns Promise with created video or error
   */
  async create(videoData: VideoCreateData & { file?: File }): Promise<ApiResult<Video>> {
    try {
      let video_url = videoData.video_url;
      let video_file_name = videoData.video_file_name;
      
      // If file is provided, upload to storage
      if (videoData.file) {
        const fileName = `${Date.now()}-${videoData.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoData.file);

        if (uploadError) {
          console.error('Error uploading video file:', uploadError);
          return {
            data: null,
            error: uploadError.message || 'Failed to upload video file',
            success: false,
          };
        }

        video_file_name = fileName;
        video_url = null; // Clear URL if file is uploaded
      }

      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.VIDEOS)
        .insert({
          title: videoData.title,
          description: videoData.description,
          video_url: video_url,
          video_file_name: video_file_name,
          type: videoData.type,
          assigned_to: 0, // Default value
          completion_rate: 0, // Default value
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating video:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.VIDEO.SAVE_FAILED,
          success: false,
        };
      }

      return {
        data: data as Video,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error creating video:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Updates an existing video
   * @param id - Video ID
   * @param updates - Video update data
   * @returns Promise with updated video or error
   */
  async update(id: string, updates: VideoUpdateData): Promise<ApiResult<Video>> {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.VIDEOS)
        .update({
          title: updates.title,
          description: updates.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.VIDEO.SAVE_FAILED,
          success: false,
        };
      }

      return {
        data: data as Video,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error updating video:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Deletes a video
   * @param id - Video ID
   * @returns Promise with success status or error
   */
  async delete(id: string): Promise<ApiResult<boolean>> {
    try {
      const { error } = await supabase
        .from(DB_CONFIG.TABLES.VIDEOS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting video:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.VIDEO.DELETE_FAILED,
          success: false,
        };
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error deleting video:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },
};

/**
 * Profile service operations
 */
export const profileService = {
  /**
   * Fetches user profile by ID
   * @param userId - User ID
   * @returns Promise with profile data or error
   */
  async getById(userId: string): Promise<ApiResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.NOT_FOUND,
          success: false,
        };
      }

      return {
        data: data as Profile,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Updates user profile
   * @param userId - User ID
   * @param updates - Profile update data
   * @returns Promise with updated profile or error
   */
  async update(userId: string, updates: Partial<Profile>): Promise<ApiResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.EMPLOYEE.UPDATE_FAILED,
          success: false,
        };
      }

      return {
        data: data as Profile,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },
};

/**
 * User role service operations
 */
export const userRoleService = {
  /**
   * Fetches user role by user ID
   * @param userId - User ID
   * @returns Promise with role data or error
   */
  async getByUserId(userId: string): Promise<ApiResult<{ role: 'admin' | 'employee' }>> {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.USER_ROLES)
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.UNAUTHORIZED,
          success: false,
        };
      }

      return {
        data: data as { role: 'admin' | 'employee' },
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error fetching user role:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Updates user role
   * @param userId - User ID
   * @param role - New role
   * @returns Promise with success status or error
   */
  async updateRole(userId: string, role: 'admin' | 'employee'): Promise<ApiResult<boolean>> {
    try {
      const { error } = await supabase
        .from(DB_CONFIG.TABLES.USER_ROLES)
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.EMPLOYEE.UPDATE_FAILED,
          success: false,
        };
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error updating user role:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },
};

/**
 * Authentication service operations
 */
export const authService = {
  /**
   * Gets current authenticated user
   * @returns Promise with user data or error
   */
  async getCurrentUser(): Promise<ApiResult<any>> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching current user:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.UNAUTHORIZED,
          success: false,
        };
      }

      return {
        data: data.user,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error fetching current user:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },

  /**
   * Signs out the current user
   * @returns Promise with success status or error
   */
  async signOut(): Promise<ApiResult<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        return {
          data: null,
          error: error.message || ERROR_MESSAGES.GENERIC,
          success: false,
        };
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error('Unexpected error signing out:', err);
      return {
        data: null,
        error: ERROR_MESSAGES.GENERIC,
        success: false,
      };
    }
  },
};

/**
 * Utility function to handle common API operations
 * @param operation - Async operation to execute
 * @returns Promise with standardized result
 */
export const handleApiOperation = async <T>(
  operation: () => Promise<T>
): Promise<ApiResult<T>> => {
  try {
    const data = await operation();
    return {
      data,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('API operation error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
};