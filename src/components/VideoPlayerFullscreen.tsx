import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quizOperations } from '@/services/quizService';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { QuizSubmissionData } from "@/types/quiz";
import { logger } from "@/utils/logger";
import { QuizModal } from "@/components/quiz/QuizModal";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CompletionOverlay } from "@/components/video/CompletionOverlay";
import { useVideoData } from "@/hooks/useVideoData";
import { useVideoProgress } from "@/hooks/useVideoProgress";

/**
 * Props interface for the VideoPlayerFullscreen component
 * @interface VideoPlayerFullscreenProps
 */
interface VideoPlayerFullscreenProps {
  /** Controls whether the modal is open or closed */
  open: boolean;
  /** Callback function to handle modal state changes */
  onOpenChange: (open: boolean) => void;
  /** ID of the video to display, null when no video is selected */
  videoId: string | null;
  /** Optional callback to report video progress updates to parent */
  onProgressUpdate?: (progress: number) => void;
}

/**
 * Fullscreen video player modal component for the Senior Services Training Portal
 * 
 * This component provides a fullscreen video viewing experience with:
 * - Progress tracking for YouTube, Google Drive, and direct video files
 * - Automatic completion detection and database persistence
 * - Accessible controls and keyboard navigation
 * - Real-time progress updates with debounced database saves
 * - Comprehensive error handling and logging
 * - Performance monitoring and optimization
 * 
 * Features:
 * - Supports YouTube, Google Drive, and direct video file playback
 * - Tracks viewing progress automatically with fallback for embedded videos
 * - Saves progress to database with debounced updates to prevent excessive API calls
 * - Handles completion detection and user feedback
 * - Provides manual completion option for users
 * - Implements proper cleanup to prevent memory leaks
 * 
 * @component
 * @param {VideoPlayerFullscreenProps} props - Component props
 * @returns {JSX.Element} Fullscreen video player modal
 */
export const VideoPlayerFullscreen: React.FC<VideoPlayerFullscreenProps> = ({
  open,
  onOpenChange,
  videoId,
  onProgressUpdate
}) => {
  // State management
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResponses, setQuizResponses] = useState<QuizSubmissionData[]>([]);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  
  // Hooks for authentication and user feedback
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Custom hooks for data management
  const { video, quiz, loading, loadVideoData, resetVideoData } = useVideoData();
  const { 
    progress, 
    isCompleted, 
    wasEverCompleted, 
    updateProgress, 
    resetProgress, 
    loadExistingProgress 
  } = useVideoProgress({
    videoId,
    userEmail: user?.email || null,
    onProgressUpdate
  });

  // Effect to load video data and existing progress when modal opens
  useEffect(() => {
    const initializeVideo = async () => {
      if (!open || !videoId) {
        // Reset state when modal is closed or no video selected
        resetVideoData();
        resetProgress();
        setShowCompletionOverlay(false);
        setQuizStarted(false);
        return;
      }

      const loadResult = await loadVideoData(videoId);
      
      if (!loadResult.success) {
        toast({
          title: "Video Loading Error",
          description: "Unable to load video details. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Load existing progress if user is authenticated
      if (user?.email) {
        await loadExistingProgress();
      }
    };

    initializeVideo();
  }, [open, videoId, user?.email, loadVideoData, resetVideoData, resetProgress, loadExistingProgress, toast]);

  // Handle video completion
  const handleVideoCompletion = useCallback(() => {
    if (progress >= 100 && !wasEverCompleted) {
      setShowCompletionOverlay(true);
      
      logger.videoEvent('video_completed', videoId || '', {
        userEmail: user?.email,
        completionTime: new Date().toISOString(),
        hasQuiz: !!quiz
      });
    }
  }, [progress, wasEverCompleted, videoId, user?.email, quiz]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    updateProgress(100);
    setShowCompletionOverlay(true);
  }, [updateProgress]);

  // Handle complete training (no quiz)
  const handleCompleteTraining = useCallback(() => {
    setShowCompletionOverlay(false);
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed this training video."
    });
    onOpenChange(false);
  }, [toast, onOpenChange]);


  // Handle quiz submission
  const handleQuizSubmit = useCallback(async () => {
    if (!quiz || !user?.email || !quizResponses.length) {
      logger.warn('Cannot submit quiz: missing quiz, user, or responses', {
        hasQuiz: !!quiz,
        hasUser: !!user?.email,
        hasResponses: quizResponses.length > 0
      });
      return;
    }

    try {
      await quizOperations.submitQuiz(user.email, quiz.id, quizResponses);
      
      logger.info('Quiz submitted successfully', { 
        quizId: quiz.id, 
        videoId: video?.id,
        userEmail: user.email 
      });

      setQuizStarted(false);
      setShowCompletionOverlay(false);
      onProgressUpdate?.(100);

      toast({
        title: "Training Completed! 🎉",
        description: "You've successfully completed the training and quiz."
      });

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to submit quiz', error);
      toast({
        title: "Quiz Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  }, [quiz, user?.email, video?.id, onProgressUpdate, toast, onOpenChange, quizResponses]);

  // Handle starting the quiz
  const handleStartQuiz = useCallback(() => {
    setQuizStarted(true);
    setShowCompletionOverlay(false);
    
    // Scroll to quiz section
    setTimeout(() => {
      const quizSection = document.getElementById('quiz-section');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // Handle quiz responses change
  const handleQuizResponsesChange = useCallback((responses: QuizSubmissionData[], allAnswered: boolean) => {
    setQuizResponses(responses);
    setAllQuestionsAnswered(allAnswered);
  }, []);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl"
        onOpenAutoFocus={(e) => {
          // Let the video container receive focus instead
          e.preventDefault();
          setTimeout(() => {
            const videoContainer = document.querySelector('[data-video-container]') as HTMLElement;
            if (videoContainer) {
              videoContainer.focus();
            }
          }, 100);
        }}
        aria-describedby="video-description"
      >
        
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Play className="w-5 h-5 text-primary" aria-hidden="true" />
                {video?.title || 'Training Video'}
              </DialogTitle>
              
              {video?.description && video.description.trim() && (
                <div className="pt-2 pb-1">
                  <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 mr-8">
            </div>
          </div>
          
        </DialogHeader>
        
        <div 
          className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0 relative"
          data-video-container
          tabIndex={0}
          aria-label="Video player. Press spacebar to play or pause."
          role="application"
        >
          <VideoPlayer
            video={video}
            loading={loading}
            progress={progress}
            onProgressUpdate={updateProgress}
            onVideoEnded={handleVideoEnded}
            updateProgressToDatabase={async () => {}} // This is handled by the progress hook now
          />
          
          {/* Completion Overlay */}
          {showCompletionOverlay && progress >= 100 && (
            <CompletionOverlay
              video={video}
              quiz={quiz}
              onStartQuiz={handleStartQuiz}
              onCompleteTraining={handleCompleteTraining}
            />
          )}
        </div>

        {/* Quiz Section */}
        {quizStarted && quiz && (
          <div id="quiz-section" className="mt-8 border-t pt-8">
            <QuizModal
              quiz={quiz}
              onSubmit={handleQuizSubmit}
              onCancel={() => {}}
              onResponsesChange={handleQuizResponsesChange}
            />
          </div>
        )}

        {/* Dialog Footer */}
        {quizStarted && quiz && (
          <DialogFooter>
            <Button
              onClick={handleQuizSubmit}
              disabled={!allQuestionsAnswered}
              className="w-full"
            >
              Submit Quiz
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};