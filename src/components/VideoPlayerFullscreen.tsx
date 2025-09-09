import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quizOperations } from '@/services/quizService';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { QuizSubmissionData, QuizResponse } from "@/types/quiz";
import type { Video } from "@/types";
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
  /** Optional initial video data to avoid extra fetch */
  initialVideo?: Video;
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
  onProgressUpdate,
  initialVideo
}) => {
  // State management
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResponse[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizSubmissionData[]>([]);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [hasQuizChanges, setHasQuizChanges] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [completedQuizResults, setCompletedQuizResults] = useState<QuizResponse[]>([]);
  const [correctOptions, setCorrectOptions] = useState<Record<string, string[]>>({});
  
  // Hooks for authentication and user feedback
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Custom hooks for data management
  const { video, quiz, videoLoading, quizLoading, loadVideoData, resetVideoData } = useVideoData();
  const { 
    progress, 
    isCompleted, 
    wasEverCompleted, 
    updateProgress, 
    resetProgress, 
    loadExistingProgress,
    markComplete
  } = useVideoProgress({
    videoId,
    userEmail: user?.email || null,
    onProgressUpdate,
    hasQuiz: quizLoading || !!quiz
  });

  // Effect to load video data and existing progress when modal opens
  useEffect(() => {
    const initializeVideo = async () => {
      if (!open || !videoId) {
        // Reset state when modal is closed or no video selected
        resetVideoData();
        resetProgress();
        setShowCompletionOverlay(false);
        setOverlayDismissed(false);
        setShouldShowOverlay(false);
        setQuizStarted(false);
        setQuizSubmitted(false);
        setQuizResults([]);
        setCompletedQuizResults([]);
        return;
      }

      const loadResult = await loadVideoData(videoId, initialVideo);
      
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
  }, [open, videoId, user?.email, loadVideoData, resetVideoData, resetProgress, loadExistingProgress, toast, initialVideo]);

  // Separate effect to load completed quiz results when completion status is determined
  useEffect(() => {
    const loadCompletedQuizResults = async () => {
      if (!wasEverCompleted || !quiz || !user?.email || !videoId) return;

      try {
        const attempts = await quizOperations.getUserAttempts(user.email);
        const videoQuizAttempts = attempts.filter(attempt => attempt.quiz.video_id === videoId);
        const latestAttempt = videoQuizAttempts[0]; // Most recent attempt
        
        if (latestAttempt?.responses) {
          setCompletedQuizResults(latestAttempt.responses);
          
          // Fetch correct options for completed quiz
          const correctOpts = await quizOperations.getCorrectOptionsForQuiz(quiz.id);
          setCorrectOptions(correctOpts);
        }
      } catch (error) {
        logger.warn('Failed to load completed quiz results', { videoId, error });
      }
    };

    loadCompletedQuizResults();
  }, [wasEverCompleted, quiz, user?.email, videoId]);

  // Effect to show completion overlay when progress reaches completion threshold
  useEffect(() => {
    // Never show completion overlay if training was ever completed
    if (!quiz || wasEverCompleted || overlayDismissed || quizStarted) {
      setShouldShowOverlay(false);
      return;
    }
    
    // Show overlay if progress is 99% or higher and video has a quiz
    if (progress >= 99) {
      setShowCompletionOverlay(true);
      setShouldShowOverlay(true);
    }
  }, [progress, quiz, wasEverCompleted, overlayDismissed, quizStarted]);

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
    // If quiz exists, cap at 99% and show completion overlay
    // If no quiz, allow 100% completion
    if (quiz) {
      updateProgress(99);
      if (!wasEverCompleted) {
        setShowCompletionOverlay(true);
      }
    } else {
      updateProgress(100);
      if (!wasEverCompleted) {
        setShowCompletionOverlay(true);
      }
    }
  }, [updateProgress, wasEverCompleted, quiz]);

  // Handle complete training (no quiz)
  const handleCompleteTraining = useCallback(() => {
    setShowCompletionOverlay(false);
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed this training video."
    });
    
    // Notify parent dashboard to refresh
    onProgressUpdate?.(100);
    
    onOpenChange(false);
  }, [toast, onOpenChange, onProgressUpdate]);


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
      const attemptId = await quizOperations.submitQuiz(user.email, quiz.id, quizResponses);
      
      // Get quiz results to show correct/incorrect answers
      const attempts = await quizOperations.getUserAttempts(user.email);
      const currentAttempt = attempts.find(attempt => attempt.id === attemptId);
      
      if (currentAttempt?.responses) {
        setQuizResults(currentAttempt.responses);
      }
      
      // Fetch correct options after submission to show in results
      const correctOpts = await quizOperations.getCorrectOptionsForQuiz(quiz.id);
      setCorrectOptions(correctOpts);
      
      logger.info('Quiz submitted successfully', { 
        quizId: quiz.id, 
        videoId: video?.id,
        userEmail: user.email 
      });

      setQuizSubmitted(true);
      
      // Mark training as complete now that quiz is submitted
      await markComplete();

      toast({
        title: "Quiz Submitted! 📝",
        description: "Review your answers and complete the training."
      });

    } catch (error) {
      logger.error('Failed to submit quiz', error);
      toast({
        title: "Quiz Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  }, [quiz, user?.email, video?.id, onProgressUpdate, toast, quizResponses]);

  // Handle marking training complete
  const handleMarkTrainingComplete = useCallback(() => {
    setQuizStarted(false);
    setShowCompletionOverlay(false);
    
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed the training and quiz."
    });

    // Notify parent dashboard to refresh
    onProgressUpdate?.(100);

    // Close the dialog
    onOpenChange(false);
  }, [toast, onOpenChange, onProgressUpdate]);

  // Handle starting the quiz
  const handleStartQuiz = useCallback(() => {
    // Prevent starting quiz if training was already completed previously
    if (wasEverCompleted) return;

    setQuizStarted(true);
    setShowCompletionOverlay(false);
    setOverlayDismissed(true);
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
    
    // Scroll to quiz section
    setTimeout(() => {
      const quizSection = document.getElementById('quiz-section');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, [wasEverCompleted]);

  // Handle closing the completion overlay
  const handleCloseOverlay = useCallback(() => {
    setShowCompletionOverlay(false);
    setShouldShowOverlay(false);
    setOverlayDismissed(true);
  }, []);

  // Handle quiz responses change
  const handleQuizResponsesChange = useCallback((responses: QuizSubmissionData[], allAnswered: boolean) => {
    setQuizResponses(responses);
    setAllQuestionsAnswered(allAnswered);
    
    // Check if any responses have been made (user has started answering)
    const hasAnyResponses = responses.some(response => 
      response.selected_option_id || response.text_answer?.trim()
    );
    setHasQuizChanges(hasAnyResponses);
  }, []);

  // Handle cancel button click
  const handleCancelClick = useCallback(() => {
    if (quizSubmitted) {
      // Quiz already submitted, just go back to completion overlay
      setQuizStarted(false);
      setShowCompletionOverlay(true);
      return;
    }
    
    if (hasQuizChanges) {
      setShowCancelConfirmation(true);
    } else {
      // No changes made, cancel directly
      setQuizStarted(false);
      setShowCompletionOverlay(true);
    }
  }, [hasQuizChanges, quizSubmitted]);

  // Handle confirmed cancellation (user wants to lose changes)
  const handleConfirmedCancel = useCallback(() => {
    setShowCancelConfirmation(false);
    setQuizStarted(false);
    setShowCompletionOverlay(true);
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
  }, []);

  // Handle dialog close
  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open && quizSubmitted) {
      // If quiz was submitted and user is closing dialog, mark training complete
      handleMarkTrainingComplete();
      return;
    }
    onOpenChange(open);
  }, [quizSubmitted, handleMarkTrainingComplete, onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto"
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
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" aria-hidden="true" />
            {video?.title || 'Training Video'}
          </DialogTitle>
        </DialogHeader>
        
        <div>
          {video?.description && video.description.trim() && (
            <div className="pb-4" id="video-description">
              <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                {video.description}
              </p>
            </div>
          )}

          {/* Persistent Quiz CTA Button */}
          {quiz && !wasEverCompleted && overlayDismissed && !quizStarted && progress >= 99 && (
            <div className="pb-4">
              <Button 
                onClick={handleStartQuiz}
                className="w-full"
                size="lg"
              >
                Start Quiz to Complete Training
              </Button>
            </div>
          )}

          <div 
            className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0 relative"
            data-video-container
            tabIndex={0}
            aria-label="Video player. Press spacebar to play or pause."
            role="application"
          >
            <VideoPlayer
              video={video}
              loading={videoLoading}
              progress={progress}
              onProgressUpdate={updateProgress}
              onVideoEnded={handleVideoEnded}
              updateProgressToDatabase={async () => {}} // This is handled by the progress hook now
            />
            
            {/* Completion Overlay - Only show if training was never completed */}
            {shouldShowOverlay && showCompletionOverlay && !wasEverCompleted && (
              <CompletionOverlay
                video={video}
                quiz={quiz}
                onStartQuiz={handleStartQuiz}
                onCompleteTraining={handleCompleteTraining}
                onClose={quiz ? handleCloseOverlay : undefined}
              />
            )}
          </div>

          {/* Quiz Section */}
          {((quizStarted && quiz) || (wasEverCompleted && quiz && completedQuizResults.length > 0)) && (
            <div id="quiz-section" className="mt-8 border-t pt-8">
              <QuizModal
                quiz={quiz}
                onSubmit={handleQuizSubmit}
                onCancel={() => {}}
                onResponsesChange={handleQuizResponsesChange}
                quizResults={wasEverCompleted ? completedQuizResults : quizResults}
                isSubmitted={wasEverCompleted || quizSubmitted}
                correctOptions={correctOptions}
              />
            </div>
          )}
        </div>

        {/* Dialog Footer - Only show for active quiz attempts, not completed ones */}
        {quizStarted && quiz && !wasEverCompleted && (
          <DialogFooter>
            <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleCancelClick}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Quiz?</AlertDialogTitle>
                </AlertDialogHeader>
                <div>
                  <AlertDialogDescription>
                    You have unsaved changes to your quiz responses. If you cancel now, your answers will be lost and you won't complete this training.
                  </AlertDialogDescription>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Working</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmedCancel}>
                    Yes, Cancel Quiz
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {!quizSubmitted ? (
              <Button
                onClick={handleQuizSubmit}
                disabled={!allQuestionsAnswered}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleMarkTrainingComplete}
                className="shadow-md hover:shadow-lg transition-shadow bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                Mark Training Complete
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};