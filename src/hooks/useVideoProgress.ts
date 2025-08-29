import { useState, useCallback, useRef } from 'react';
import { progressOperations } from '@/services/api';
import { logger } from '@/utils/logger';
import { withErrorHandler } from '@/utils/errorHandler';

interface UseVideoProgressProps {
  videoId: string | null;
  userEmail: string | null;
  onProgressUpdate?: (progress: number) => void;
}

export function useVideoProgress({ videoId, userEmail, onProgressUpdate }: UseVideoProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasEverCompleted, setWasEverCompleted] = useState(false);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  const updateProgressToDatabase = useCallback(async (progressPercent: number) => {
    if (!userEmail || !videoId) {
      logger.warn('Cannot update progress: missing user email or video ID', {
        hasUser: !!userEmail,
        hasVideoId: !!videoId
      });
      return { success: false };
    }

    const updateResult = await withErrorHandler(
      async () => {
        const completedAt = progressPercent >= 100 ? new Date() : undefined;
        
        await progressOperations.updateByEmail(
          userEmail,
          videoId,
          progressPercent,
          completedAt
        );

        logger.dbOperation('update', 'video_progress', true, {
          videoId,
          userEmail,
          progress: progressPercent,
          completed: progressPercent >= 100
        });

        // Handle completion state change
        if (progressPercent >= 100 && !wasEverCompleted) {
          setIsCompleted(true);
          setWasEverCompleted(true);
          
          logger.videoEvent('video_completed', videoId, {
            userEmail,
            completionTime: new Date().toISOString()
          });
        }
      },
      { videoId, userEmail, progress: progressPercent },
      'Failed to save your progress'
    );

    return updateResult;
  }, [userEmail, videoId, wasEverCompleted]);

  const updateProgress = useCallback((progressPercent: number) => {
    setProgress(progressPercent);
    onProgressUpdate?.(progressPercent);

    // Debounce database updates
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgressToDatabase(progressPercent);
    }, 1000);
  }, [updateProgressToDatabase, onProgressUpdate]);

  const markComplete = useCallback(async () => {
    setProgress(100);
    setIsCompleted(true);
    setWasEverCompleted(true);
    onProgressUpdate?.(100);
    
    return await updateProgressToDatabase(100);
  }, [updateProgressToDatabase, onProgressUpdate]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsCompleted(false);
    setWasEverCompleted(false);
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
  }, []);

  const loadExistingProgress = useCallback(async () => {
    if (!userEmail || !videoId) return;

    try {
      const progressResult = await progressOperations.getByEmailAndVideo(userEmail, videoId);
      
      if (progressResult.success && progressResult.data) {
        const progressData = progressResult.data;
        const progressPercent = progressData.progress_percent;
        
        setProgress(progressPercent);
        const isVideoCompleted = progressPercent >= 100;
        setIsCompleted(isVideoCompleted);
        setWasEverCompleted(isVideoCompleted);
        
        logger.videoEvent('progress_restored', videoId, {
          progress: progressPercent,
          completed: isVideoCompleted
        });
      } else {
        resetProgress();
      }
    } catch (error) {
      logger.error('Failed to load existing progress', error);
      resetProgress();
    }
  }, [userEmail, videoId, resetProgress]);

  return {
    progress,
    isCompleted,
    wasEverCompleted,
    updateProgress,
    markComplete,
    resetProgress,
    loadExistingProgress
  };
}