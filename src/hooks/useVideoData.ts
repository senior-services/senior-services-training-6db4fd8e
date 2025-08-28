import { useState, useCallback } from 'react';
import { videoOperations } from '@/services/api';
import { quizOperations } from '@/services/quizService';
import { logger } from '@/utils/logger';
import { withErrorHandler } from '@/utils/errorHandler';
import type { Video } from '@/types';
import type { QuizWithQuestions } from '@/types/quiz';

export function useVideoData() {
  const [video, setVideo] = useState<Video | null>(null);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(false);

  const loadVideoData = useCallback(async (videoId: string) => {
    setLoading(true);
    
    const loadResult = await withErrorHandler(
      async () => {
        // Load video
        const res = await videoOperations.getById(videoId);
        if (!res.success || !res.data) {
          throw new Error(res.error || 'Failed to load video');
        }
        setVideo(res.data);
        
        logger.videoEvent('video_loaded', videoId, { title: res.data.title });

        // Load quiz for this video
        try {
          const quizData = await quizOperations.getByVideoId(videoId);
          setQuiz(quizData);
          logger.info('Quiz loaded for video', { videoId, hasQuiz: !!quizData });
        } catch (error) {
          logger.warn('No quiz found for video', { videoId, error });
          setQuiz(null);
        }
        
        return res.data;
      },
      { videoId },
      'Unable to load video details'
    );

    setLoading(false);
    
    return loadResult;
  }, []);

  const resetVideoData = useCallback(() => {
    setVideo(null);
    setQuiz(null);
    setLoading(false);
  }, []);

  return {
    video,
    quiz,
    loading,
    loadVideoData,
    resetVideoData
  };
}