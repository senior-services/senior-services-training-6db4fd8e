/**
 * Custom hook for video management operations
 * Provides centralized video state management with optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { Video, VideoFormData, VideoUpdateData, ApiResponse } from '@/types';
import { videoService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';
import { validateVideoTitle, validateVideoDescription, validateVideoFile } from '@/utils/validation';

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: string | null;
  selectedVideo: Video | null;
  // Actions
  fetchVideos: () => Promise<void>;
  addVideo: (videoData: VideoFormData) => Promise<boolean>;
  updateVideo: (id: string, updates: VideoUpdateData) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;
  selectVideo: (video: Video | null) => void;
  // Validation helpers
  validateVideoData: (videoData: VideoFormData) => { isValid: boolean; errors: string[] };
}

/**
 * Hook for managing video operations
 * @returns Video state and management functions
 */
export const useVideos = (): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  const { toast } = useToast();

  /**
   * Fetches all videos from the database
   */
  const fetchVideos = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await videoService.getAll();

      if (result.success && result.data) {
        setVideos(result.data);
      } else {
        setError(result.error || ERROR_MESSAGES.VIDEO.LOAD_FAILED);
        toast({
          title: 'Error',
          description: result.error || ERROR_MESSAGES.VIDEO.LOAD_FAILED,
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Validates video form data
   */
  const validateVideoData = useCallback((videoData: VideoFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate title
    const titleValidation = validateVideoTitle(videoData.title);
    if (!titleValidation.isValid) {
      errors.push(...titleValidation.errors);
    }

    // Validate description
    const descValidation = validateVideoDescription(videoData.description);
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }

    // Validate file or URL based on type
    if (videoData.type === 'file') {
      if (!videoData.file) {
        errors.push('Please select a video file to upload.');
      } else {
        const fileValidation = validateVideoFile(videoData.file);
        if (!fileValidation.isValid) {
          errors.push(...fileValidation.errors);
        }
      }
    } else if (videoData.type === 'url') {
      if (!videoData.url?.trim()) {
        errors.push('Please enter a video URL.');
      }
      // Additional URL validation could be added here
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Adds a new video with validation
   */
  const addVideo = useCallback(async (videoData: VideoFormData): Promise<boolean> => {
    try {
      // Validate input data
      const validation = validateVideoData(videoData);
      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(' '),
          variant: 'destructive',
        });
        return false;
      }

      // Prepare video creation data - removed type conflict
      const tempVideo: Video = {
        id: `temp-${Date.now()}`,
        title: videoData.title || 'New Video',
        description: videoData.description,
        video_url: videoData.url || null,
        video_file_name: videoData.file?.name || null,
        type: 'Optional',
        has_quiz: false,
        assigned_to: 0,
        completion_rate: 0,
        duration_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setVideos(prev => [tempVideo, ...prev]);

      // Make API call
      const result = await videoService.create({
        title: videoData.title || 'Untitled Video',
        description: videoData.description,
        video_url: videoData.url,
        video_file_name: videoData.file?.name,
        type: 'Optional',
        file: videoData.file // Pass the actual file for upload
      });

      if (result.success && result.data) {
        // Replace temporary video with real data
        setVideos(prev => prev.map(v => v.id === tempVideo.id ? result.data! : v));
        
        toast({
          title: 'Success',
          description: SUCCESS_MESSAGES.VIDEO.CREATED,
        });

        return true;
      } else {
        // Remove temporary video on error
        setVideos(prev => prev.filter(v => v.id !== tempVideo.id));
        
        toast({
          title: 'Error',
          description: result.error || ERROR_MESSAGES.VIDEO.SAVE_FAILED,
          variant: 'destructive',
        });

        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  }, [toast, validateVideoData]);

  /**
   * Updates an existing video
   */
  const updateVideo = useCallback(async (id: string, updates: VideoUpdateData): Promise<boolean> => {
    try {
      // Validate updates
      const titleValidation = validateVideoTitle(updates.title);
      const descValidation = validateVideoDescription(updates.description);

      if (!titleValidation.isValid) {
        toast({
          title: 'Validation Error',
          description: titleValidation.errors.join(' '),
          variant: 'destructive',
        });
        return false;
      }

      if (!descValidation.isValid) {
        toast({
          title: 'Validation Error',
          description: descValidation.errors.join(' '),
          variant: 'destructive',
        });
        return false;
      }

      // Optimistic update
      const originalVideos = [...videos];
      setVideos(prev => prev.map(video => 
        video.id === id 
          ? { ...video, ...updates, updated_at: new Date().toISOString() }
          : video
      ));

      // Make API call
      const result = await videoService.update(id, updates);

      if (result.success && result.data) {
        // Update with server data
        setVideos(prev => prev.map(video => 
          video.id === id ? result.data! : video
        ));

        toast({
          title: 'Success',
          description: SUCCESS_MESSAGES.VIDEO.UPDATED,
        });

        return true;
      } else {
        // Revert optimistic update on error
        setVideos(originalVideos);
        
        toast({
          title: 'Error',
          description: result.error || ERROR_MESSAGES.VIDEO.SAVE_FAILED,
          variant: 'destructive',
        });

        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  }, [videos, toast]);

  /**
   * Deletes a video
   */
  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Optimistic update - remove from UI immediately
      const originalVideos = [...videos];
      setVideos(prev => prev.filter(video => video.id !== id));

      // Make API call
      const result = await videoService.delete(id);

      if (result.success) {
        toast({
          title: 'Success',
          description: SUCCESS_MESSAGES.VIDEO.DELETED,
        });

        return true;
      } else {
        // Revert optimistic update on error
        setVideos(originalVideos);
        
        toast({
          title: 'Error',
          description: result.error || ERROR_MESSAGES.VIDEO.DELETE_FAILED,
          variant: 'destructive',
        });

        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      
      // Revert optimistic update on error
      setVideos(videos);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  }, [videos, toast]);

  /**
   * Selects a video for viewing/editing
   */
  const selectVideo = useCallback((video: Video | null): void => {
    setSelectedVideo(video);
  }, []);

  // Load videos on component mount
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    selectedVideo,
    fetchVideos,
    addVideo,
    updateVideo,
    deleteVideo,
    selectVideo,
    validateVideoData,
  };
};