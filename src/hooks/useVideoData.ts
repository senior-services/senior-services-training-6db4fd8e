import { useState, useCallback } from 'react';
import { videoOperations } from '@/services/api';
import { quizOperations, clearUserRoleCache } from '@/services/quizService';
import { logger } from '@/utils/logger';
import { withErrorHandler } from '@/utils/errorHandler';
import type { Video } from '@/types';
import type { QuizWithQuestions } from '@/types/quiz';

export function useVideoData() {
  const [video, setVideo] = useState<Video | null>(null);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  const loadVideoData = useCallback(async (videoId: string, initialVideo?: Video) => {
    // If we have initial video data, use it immediately
    if (initialVideo) {
      setVideo(initialVideo);
      logger.videoEvent('video_loaded_from_initial', videoId, { title: initialVideo.title });
    } else {
      setVideoLoading(true);
    }
    
    // Load quiz in parallel, independently
    setQuizLoading(true);
    
    const loadVideoPromise = initialVideo ? 
      Promise.resolve({ success: true, data: initialVideo }) :
      withErrorHandler(
        async () => {
          const res = await videoOperations.getById(videoId);
          if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to load video');
          }
          setVideo(res.data);
          logger.videoEvent('video_loaded', videoId, { title: res.data.title });
          return res.data;
        },
        { videoId },
        'Unable to load video details'
      );

    const loadQuizPromise = withErrorHandler(
      async () => {
        try {
          const quizData = await quizOperations.getByVideoId(videoId);
          setQuiz(quizData);
          logger.info('Quiz loaded for video', { videoId, hasQuiz: !!quizData });
          return quizData;
        } catch (error) {
          logger.warn('No quiz found for video', { videoId, error });
          setQuiz(null);
          return null;
        }
      },
      { videoId },
      'Unable to load quiz data'
    );

    // Run both loads in parallel
    const [videoResult, quizResult] = await Promise.allSettled([loadVideoPromise, loadQuizPromise]);
    
    if (!initialVideo) {
      setVideoLoading(false);
    }
    setQuizLoading(false);
    
    // Return video result for backward compatibility
    return videoResult.status === 'fulfilled' ? videoResult.value : { success: false, error: 'Failed to load video' };
  }, []);

  const resetVideoData = useCallback(() => {
    setVideo(null);
    setQuiz(null);
    setVideoLoading(false);
    setQuizLoading(false);
    // Clear role cache when resetting data (e.g., on logout)
    clearUserRoleCache();
  }, []);

  return {
    video,
    quiz,
    videoLoading,
    quizLoading,
    loading: videoLoading || quizLoading, // For backward compatibility
    loadVideoData,
    resetVideoData
  };
}