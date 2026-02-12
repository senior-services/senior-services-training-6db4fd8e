import { useState, useCallback, useRef } from 'react';
import { progressOperations } from '@/services/api';
import { logger } from '@/utils/logger';
import { withErrorHandler } from '@/utils/errorHandler';

interface UseVideoProgressProps {
  videoId: string | null;
  userEmail: string | null;
  onProgressUpdate?: (progress: number) => void;
  hasQuiz?: boolean;
}

export function useVideoProgress({ videoId, userEmail, onProgressUpdate, hasQuiz }: UseVideoProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasEverCompleted, setWasEverCompleted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  const updateProgressToDatabase = useCallback(async (
    progressPercent: number, 
    forceComplete?: boolean,
    acknowledgmentData?: {
      acknowledgedAt: Date;
      viewingSeconds: number;
    }
  ) => {
    if (!userEmail || !videoId) {
      logger.warn('Cannot update progress: missing user email or video ID', {
        hasUser: !!userEmail,
        hasVideoId: !!videoId
      });
      return { success: false };
    }

    // Prevent regression if locked (completed)
    if (isLocked && progressPercent < 100 && !forceComplete) {
      logger.info('Progress locked - video already completed', {
        videoId,
        currentProgress: progress,
        attemptedProgress: progressPercent
      });
      return { success: true };
    }

    const updateResult = await withErrorHandler(
      async () => {
        // Only complete if 100% AND explicitly forced (after attestation or quiz submit)
        const shouldComplete = progressPercent >= 100 && forceComplete === true;
        const completedAt = shouldComplete ? new Date() : undefined;
        
        logger.info('Updating progress to database', {
          videoId,
          userEmail,
          progressPercent,
          shouldComplete,
          hasQuiz,
          forceComplete,
          hasAcknowledgment: !!acknowledgmentData
        });

        const result = await progressOperations.updateByEmail(
          userEmail,
          videoId,
          progressPercent,
          completedAt,
          acknowledgmentData?.acknowledgedAt,
          acknowledgmentData?.viewingSeconds
        );

        if (!result.success) {
          logger.error('Failed to update progress', undefined, {
            videoId,
            userEmail,
            error: result.error
          });
          return;
        }

        logger.dbOperation('update', 'video_progress', true, {
          videoId,
          userEmail,
          progress: progressPercent,
          completed: shouldComplete
        });

        // Mark as completed if should complete
        if (shouldComplete && !wasEverCompleted) {
          setIsCompleted(true);
          setWasEverCompleted(true);
          setIsLocked(true);
          
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
  }, [userEmail, videoId, wasEverCompleted, hasQuiz, isLocked, progress]);

  const updateProgress = useCallback((progressPercent: number) => {
    // Block updates if locked
    if (isLocked && progressPercent < 100) {
      logger.info('Progress locked - ignoring update', {
        videoId,
        attemptedProgress: progressPercent
      });
      return;
    }
    
    // Cap at 99% if quiz exists and not completed yet
    const cappedProgress = hasQuiz && progressPercent >= 100 && !wasEverCompleted ? 99 : progressPercent;
    
    // Only update if higher than current
    setProgress(currentProgress => Math.max(currentProgress, cappedProgress));
    onProgressUpdate?.(cappedProgress);

    // Debounce database updates
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgressToDatabase(cappedProgress);
    }, 1000);
  }, [updateProgressToDatabase, onProgressUpdate, hasQuiz, wasEverCompleted, videoId, isLocked]);

  const markComplete = useCallback(async () => {
    // Clear pending updates
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
      progressUpdateTimeoutRef.current = undefined;
    }

    // Lock and mark complete
    setIsLocked(true);
    setProgress(100);
    setIsCompleted(true);
    setWasEverCompleted(true);
    onProgressUpdate?.(100);
    
    logger.info('Marking video as complete', { videoId, userEmail });
    
    // Force completion even with quiz
    return await updateProgressToDatabase(100, true);
  }, [updateProgressToDatabase, onProgressUpdate, videoId, userEmail]);

  const resetProgress = useCallback(() => {
    setIsLocked(false);
    setProgress(0);
    setIsCompleted(false);
    setWasEverCompleted(false);
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
  }, []);

  const loadExistingProgress = useCallback(async () => {
    if (!userEmail || !videoId) {
      logger.warn('Cannot load progress - missing credentials', { 
        hasUserEmail: !!userEmail, 
        hasVideoId: !!videoId 
      });
      return;
    }

    try {
      logger.info('Loading existing progress', { userEmail, videoId });
      
      const progressResult = await progressOperations.getByEmailAndVideo(userEmail, videoId);
      
      if (!progressResult.success) {
        logger.error('Failed to load progress', undefined, { 
          error: progressResult.error,
          userEmail,
          videoId
        });
        resetProgress();
        return;
      }
      
      if (progressResult.data) {
        const progressData = progressResult.data;
        const progressPercent = progressData.progress_percent;
        const isVideoCompleted = !!progressData.completed_at;
        
        setProgress(progressPercent);
        setIsCompleted(isVideoCompleted);
        setWasEverCompleted(isVideoCompleted);
        setIsLocked(isVideoCompleted);
        
        logger.videoEvent('progress_restored', videoId, {
          progress: progressPercent,
          completed: isVideoCompleted,
          locked: isVideoCompleted
        });

        return { completedAt: progressData.completed_at || null, progressPercent };
      } else {
        logger.info('No existing progress found', { userEmail, videoId });
        resetProgress();
        return { completedAt: null, progressPercent: 0 };
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