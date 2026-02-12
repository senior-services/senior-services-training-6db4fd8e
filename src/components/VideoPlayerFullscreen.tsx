import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Dialog, FullscreenDialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogScrollArea } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Clock } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { TrainingAttestation } from "@/components/shared/TrainingAttestation";
import { quizOperations } from '@/services/quizService';
import { progressOperations } from '@/services/api';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { QuizSubmissionData, QuizResponse, QuizWithQuestions } from "@/types/quiz";
import type { Video, TrainingContent } from "@/types";
import { logger } from "@/utils/logger";
import { QuizModal } from "@/components/quiz/QuizModal";
import { ContentPlayer } from "@/components/content/ContentPlayer";
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
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResponse[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizSubmissionData[]>([]);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [hasQuizChanges, setHasQuizChanges] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [completedQuizResults, setCompletedQuizResults] = useState<QuizResponse[]>([]);
  const [completedQuiz, setCompletedQuiz] = useState<QuizWithQuestions | null>(null);
  const [correctOptions, setCorrectOptions] = useState<Record<string, string[]>>({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [storedAttemptScore, setStoredAttemptScore] = useState<number | undefined>(undefined);
  const [storedAttemptTotal, setStoredAttemptTotal] = useState<number | undefined>(undefined);

  // Presentation compliance states
  const [viewingSeconds, setViewingSeconds] = useState(0);
  const [checkboxEnabled, setCheckboxEnabled] = useState(false);
  const [presentationAcknowledged, setPresentationAcknowledged] = useState(false);
  const [a11yAnnouncement, setA11yAnnouncement] = useState('');

  // Hooks for authentication and user feedback
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // Custom hooks for data management
  const {
    video,
    quiz,
    videoLoading: vLoading,
    quizLoading,
    loadVideoData,
    resetVideoData
  } = useVideoData();
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

  // Presentation timer constants and computed values
  const presentationMinSeconds = (video?.duration_seconds && video.duration_seconds >= 60)
    ? video.duration_seconds
    : 60;
  const isPresentation = video?.content_type === 'presentation';
  const remainingSeconds = isPresentation ? Math.max(0, presentationMinSeconds - viewingSeconds) : 0;
  const timerActive = remainingSeconds > 0;
  const formattedTime = `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;

  // Effect to load video data and existing progress when modal opens
  useEffect(() => {
    const initializeVideo = async () => {
      if (!open || !videoId) {
        // Reset state when modal is closed or no video selected
        resetVideoData();
        resetProgress();
        setShowCompletionOverlay(false);
        setOverlayDismissed(false);
        setQuizStarted(false);
        setQuizSubmitted(false);
        setQuizResults([]);
        setCompletedQuizResults([]);
        setCompletedQuiz(null);
        return;
      }
      const loadResult = await loadVideoData(videoId, initialVideo);
      if (!loadResult.success) {
        toast({
          title: "Video Loading Error",
          description: "Unable to load video details. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Load existing progress if user is authenticated
      if (user?.email) {
        const result = await loadExistingProgress();
        if (result && !result.completedAt && result.progressPercent >= 99) {
          setOverlayDismissed(true);
        }
      }
    };
    initializeVideo();
  }, [open, videoId, user?.email, loadVideoData, resetVideoData, resetProgress, loadExistingProgress, toast, initialVideo]);

  // Timer effect for presentations - track viewing duration
  useEffect(() => {
    if (!open || !video || video.content_type !== 'presentation' || checkboxEnabled) {
      return;
    }
    const timer = setInterval(() => {
      setViewingSeconds(prev => {
        const newSeconds = prev + 1;

        // Enable checkbox when minimum time reached
        if (newSeconds >= presentationMinSeconds && !checkboxEnabled) {
          setCheckboxEnabled(true);
          setA11yAnnouncement(`You may now acknowledge that you have reviewed this training material after viewing for ${presentationMinSeconds} seconds.`);
          logger.info('Presentation acknowledgment unlocked', {
            videoId,
            viewingSeconds: newSeconds,
            minimumRequired: presentationMinSeconds
          });
        }
        return newSeconds;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, video, checkboxEnabled, videoId]);

  // Reset presentation states when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setViewingSeconds(0);
      setCheckboxEnabled(false);
      setPresentationAcknowledged(false);
      setA11yAnnouncement('');
    }
  }, [open]);

  // Separate effect to load completed quiz results when completion status is determined
  useEffect(() => {
    const loadCompletedQuizResults = async () => {
      if (!wasEverCompleted || !user?.email || !videoId) return;
      try {
        const attempts = await quizOperations.getUserAttempts(user.email);
        const videoQuizAttempts = attempts.filter(attempt => attempt.quiz.video_id === videoId);
        const latestAttempt = videoQuizAttempts[0]; // Most recent attempt

        if (latestAttempt) {
          // Store the attempt's score and total for passing to QuizModal
          setStoredAttemptScore(latestAttempt.score);
          setStoredAttemptTotal(latestAttempt.total_questions);

          // Load the specific quiz version the employee completed
          const attemptQuiz = await quizOperations.getById(latestAttempt.quiz_id);
          if (attemptQuiz) {
            setCompletedQuiz(attemptQuiz);
          }

          if (latestAttempt.responses) {
            setCompletedQuizResults(latestAttempt.responses);
          }

          // Fetch correct options for the completed quiz version (not the active one)
          const correctOpts = await quizOperations.getCorrectOptionsForQuiz(latestAttempt.quiz_id);
          setCorrectOptions(correctOpts);
        }
      } catch (error) {
        logger.warn('Failed to load completed quiz results', {
          videoId,
          error
        });
      }
    };
    loadCompletedQuizResults();
  }, [wasEverCompleted, user?.email, videoId]);

  // Simple effect: Show overlay when video ends and training incomplete
  useEffect(() => {
    // Don't show if user dismissed it or started quiz or training was ever completed
    if (overlayDismissed || quizStarted || wasEverCompleted) {
      setShowCompletionOverlay(false);
      return;
    }
    
    // Show overlay when progress hits 99%+ (video ended)
    if (progress >= 99) {
      setShowCompletionOverlay(true);
    }
  }, [progress, overlayDismissed, quizStarted, wasEverCompleted]);

  // Auto-start quiz when reopening dialog with video already fully watched
  useEffect(() => {
    if (!open || quizStarted || wasEverCompleted || !overlayDismissed) return;
    if (progress >= 99 && quiz && !quizLoading) {
      setQuizStarted(true);
      setOverlayDismissed(true);
      setShowCompletionOverlay(false);
      setTimeout(() => {
        document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open, progress, quiz, quizLoading, quizStarted, wasEverCompleted, overlayDismissed]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    // Update progress based on quiz existence
    const finalProgress = quiz ? 99 : 100;
    updateProgress(finalProgress);
    
    // Show overlay if training not yet completed
    if (!wasEverCompleted) {
      setShowCompletionOverlay(true);
    }
  }, [updateProgress, wasEverCompleted, quiz]);

  // Handle complete training (no quiz)
  const handleCompleteTraining = useCallback(async () => {
    // Check presentation acknowledgment if needed
    if (video?.content_type === 'presentation' && !presentationAcknowledged) {
      toast({
        variant: 'destructive',
        title: 'Acknowledgment Required',
        description: 'Please confirm that you have reviewed the training material.'
      });
      return;
    }
    
    // Mark complete
    await markComplete();
    
    // Save presentation acknowledgment if needed
    if (video?.content_type === 'presentation' && user?.email && videoId) {
      await progressOperations.updateByEmail(
        user.email, 
        videoId, 
        100, 
        new Date(), 
        new Date(), 
        viewingSeconds
      );
    }
    
    // Close everything
    setShowCompletionOverlay(false);
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed this training."
    });
    
    onProgressUpdate?.(100);
    onOpenChange(false);
  }, [video, presentationAcknowledged, markComplete, user, videoId, viewingSeconds, toast, onProgressUpdate, onOpenChange]);

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

      // Fetch both results and correct answers before updating state
      // to avoid a flash of "incorrect" while correctOptions is still empty
      const [attempts, correctOpts] = await Promise.all([
        quizOperations.getUserAttempts(user.email),
        quizOperations.getCorrectOptionsForQuiz(quiz.id),
      ]);
      const currentAttempt = attempts.find(attempt => attempt.id === attemptId);

      // Batch all state updates so React renders once with complete data
      if (currentAttempt?.responses) {
        setQuizResults(currentAttempt.responses);
      }
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
        description: "Review your answers."
      });
    } catch (error) {
      logger.error('Failed to submit quiz', error);
      toast({
        title: "Quiz Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  }, [quiz, user?.email, video?.id, toast, quizResponses, markComplete]);

  // Handle starting the quiz
  const handleStartQuiz = useCallback(() => {
    if (wasEverCompleted) return;
    
    setQuizStarted(true);
    setShowCompletionOverlay(false);
    setOverlayDismissed(true);
    
    // Reset quiz state
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
    setQuizAttestationChecked(false);
    
    // Scroll to quiz
    setTimeout(() => {
      document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [wasEverCompleted]);

  // Handle closing the completion overlay
  const handleCloseOverlay = useCallback(() => {
    setShowCompletionOverlay(false);
    setOverlayDismissed(true);
  }, []);

  // Handle quiz responses change
  // Attestation state for quiz flow
  const [quizAttestationChecked, setQuizAttestationChecked] = useState(false);

  const handleQuizResponsesChange = useCallback((responses: QuizSubmissionData[], allAnswered: boolean, attestationChecked: boolean) => {
    setQuizResponses(responses);
    setAllQuestionsAnswered(allAnswered);
    setQuizAttestationChecked(attestationChecked);

    // Check if any responses have been made (user has started answering)
    const hasAnyResponses = responses.some(response => response.selected_option_id || response.text_answer?.trim());
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
    setShowCancelConfirmation(true);
  }, [quizSubmitted]);

  // Handle confirmed cancellation (user wants to lose changes)
  const handleConfirmedCancel = useCallback(() => {
    setShowCancelConfirmation(false);
    setQuizStarted(false);
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
    setQuizAttestationChecked(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle dialog close
  const handleDialogOpenChange = useCallback((open: boolean) => {
    onOpenChange(open);
  }, [onOpenChange]);

  // Convert Video to TrainingContent with validation and safe defaults
  const trainingContent = useMemo<TrainingContent | null>(() => {
    if (!video) return null;

    // Validate required fields
    if (!video.id || !video.title) {
      logger.warn('Video missing required fields', {
        videoId: video?.id,
        hasTitle: !!video?.title
      });
      return null;
    }
    if (!video.video_url && !video.video_file_name) {
      logger.warn('Video missing both video_url and video_file_name', {
        videoId: video.id
      });
      return null;
    }

    // Create TrainingContent with safe defaults
    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      video_url: video.video_url || null,
      video_file_name: video.video_file_name || null,
      type: video.type || 'Optional',
      content_type: video.content_type || 'video',
      duration_seconds: video.duration_seconds || 0,
      completion_rate: video.completion_rate || 0,
      created_at: video.created_at || new Date().toISOString(),
      updated_at: video.updated_at || new Date().toISOString(),
      archived_at: video.archived_at || null
    };
  }, [video]);
  return <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <FullscreenDialogContent onOpenAutoFocus={e => {
      // Let the video container receive focus instead
      e.preventDefault();
      setTimeout(() => {
        const videoContainer = document.querySelector('[data-video-container]') as HTMLElement;
        if (videoContainer) {
          videoContainer.focus();
        }
      }, 100);
    }} aria-describedby="video-description">
        
        <DialogHeader>
          <DialogTitle>
            {video?.title || 'Training Video'}
          </DialogTitle>
        </DialogHeader>
        
        <DialogScrollArea>
          <div className="flex items-start justify-between gap-4 pb-4">
            {video?.description && video.description.trim() && (
              <div className="flex-1" id="video-description">
                <p className="text-body text-foreground">
                  {video.description}
                </p>
              </div>
            )}
          </div>

          {/* Persistent Quiz CTA Button - only for non-presentation content */}
          {quiz && !isPresentation && !wasEverCompleted && overlayDismissed && !quizStarted && progress >= 99 && <div className="pb-4">
              <Button onClick={handleStartQuiz} className="w-full" size="lg">
                Start Quiz to Complete Training
              </Button>
            </div>}

          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0 relative" data-video-container tabIndex={0} aria-label="Video player. Press spacebar to play or pause." role="application">
            {trainingContent && <ContentPlayer content={trainingContent} loading={vLoading} progress={progress} onProgressUpdate={updateProgress} onComplete={handleVideoEnded} />}
            
            {/* Completion Overlay - Only show if training was never completed */}
            {showCompletionOverlay && !wasEverCompleted && <CompletionOverlay video={video} quiz={quiz} onStartQuiz={handleStartQuiz} onCompleteTraining={handleCompleteTraining} onClose={quiz ? handleCloseOverlay : undefined} />}
          </div>

          {/* Compliance Checkbox - Only for Presentations */}
          {video && video.content_type === 'presentation' && !wasEverCompleted && !quiz && !quizLoading && (
            <div className="mt-4">
              <TrainingAttestation
                enabled={checkboxEnabled}
                checked={presentationAcknowledged}
                onCheckedChange={setPresentationAcknowledged}
                disabledTooltip="Please wait for the viewing timer to complete."
              />
            </div>
          )}

          {/* Quiz Section */}
          {(quizStarted && quiz || wasEverCompleted && (completedQuiz || quiz) && completedQuizResults.length > 0) && <div id="quiz-section" className="mt-8 border-t pt-8">
              <QuizModal quiz={wasEverCompleted && completedQuiz ? completedQuiz : quiz!} onSubmit={handleQuizSubmit} onCancel={() => {}} onResponsesChange={handleQuizResponsesChange} quizResults={wasEverCompleted ? completedQuizResults : quizResults} isSubmitted={wasEverCompleted || quizSubmitted} correctOptions={correctOptions} storedScore={wasEverCompleted ? storedAttemptScore : undefined} storedTotalQuestions={wasEverCompleted ? storedAttemptTotal : undefined} />
            </div>}

          {/* Attestation - below quiz questions */}
          {quiz && (quizStarted || quizSubmitted || wasEverCompleted) && !quizSubmitted && !wasEverCompleted && (
            <div className="mt-6 max-w-4xl mx-auto">
              <TrainingAttestation
                enabled={allQuestionsAnswered}
                checked={quizAttestationChecked}
                onCheckedChange={setQuizAttestationChecked}
                disabledTooltip="Complete the questions above to enable this checkbox."
              />
            </div>
          )}
        </DialogScrollArea>

        {/* Dialog Footer - Show for quiz interactions (non-presentation only) */}
        {quiz && !isPresentation && (quizStarted || quizSubmitted || wasEverCompleted) && <DialogFooter className="flex-row sm:justify-end items-center">
            {!quizSubmitted && !wasEverCompleted ? <div className="flex gap-2">
                <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" onClick={handleCancelClick} className="shadow-md hover:shadow-lg transition-shadow">
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {hasQuizChanges ? 'Discard unsaved progress?' : 'Exit training?'}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div>
                      <AlertDialogDescription>
                        {hasQuizChanges
                          ? "If you leave now, your answers won't be saved and your training will remain incomplete."
                          : "You haven't finished the quiz yet. You'll need to submit it to mark this training as complete."}
                      </AlertDialogDescription>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {hasQuizChanges ? 'Continue Editing' : 'Return to Quiz'}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmedCancel}>
                        {hasQuizChanges ? 'Discard & Exit Training' : 'Exit Training'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                {(!allQuestionsAnswered || !quizAttestationChecked) ? (
                  <ButtonWithTooltip
                    tooltip="Complete the questions above and the final confirmation to submit."
                    disabled
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    Submit Quiz
                  </ButtonWithTooltip>
                ) : (
                  <Button
                    onClick={handleQuizSubmit}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    Submit Quiz
                  </Button>
                )}
              </div> : <DialogClose asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                  Close
                </Button>
              </DialogClose>}
          </DialogFooter>}

        {/* Unified Presentation Footer */}
        {isPresentation && !wasEverCompleted && (
          <DialogFooter className="sm:justify-between items-center">
              {quiz && quizStarted && !quizSubmitted ? (
                <div className="flex gap-2">
                  {/* Quiz started: Cancel with confirmation + Submit Quiz */}
                  <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" onClick={handleCancelClick}>
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {hasQuizChanges ? 'Discard unsaved progress?' : 'Exit training?'}
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <div>
                        <AlertDialogDescription>
                          {hasQuizChanges
                            ? "If you leave now, your answers won't be saved and your training will remain incomplete."
                            : "You haven't finished the quiz yet. You'll need to submit it to mark this training as complete."}
                        </AlertDialogDescription>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {hasQuizChanges ? 'Continue Editing' : 'Return to Quiz'}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmedCancel}>
                          {hasQuizChanges ? 'Discard & Exit Training' : 'Exit Training'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {(!allQuestionsAnswered || !quizAttestationChecked) ? (
                    <ButtonWithTooltip
                      tooltip="Complete the questions above and the final confirmation to submit."
                      disabled
                    >
                      Submit Quiz
                    </ButtonWithTooltip>
                  ) : (
                    <Button onClick={handleQuizSubmit}>
                      Submit Quiz
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Timer pinned to footer left */}
                  {timerActive ? (
                    <Banner variant="information" size="compact" icon={Clock} className="w-fit shrink-0">
                      <span className="tabular-nums whitespace-nowrap">Minimum review time: {formattedTime}</span>
                    </Banner>
                  ) : (
                    <Banner variant="success" size="compact" className="w-fit shrink-0">
                      Minimum time met
                    </Banner>
                  )}
                  {/* Pre-quiz or no-quiz: Cancel + primary action */}
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={timerActive} onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    {quizLoading ? null : quiz ? (
                      <Button
                        disabled={timerActive}
                        onClick={handleStartQuiz}
                        className={cn(
                          "transition-all duration-500",
                          !timerActive && "animate-scale-in"
                        )}
                      >
                        Start Quiz to Complete Training
                      </Button>
                    ) : (timerActive || !presentationAcknowledged) ? (
                      <ButtonWithTooltip
                        tooltip={timerActive
                          ? "Please wait for the viewing timer to complete."
                          : "Please check the acknowledgment checkbox above to proceed."
                        }
                        disabled
                        className={cn("transition-all duration-500")}
                      >
                        Complete Training
                      </ButtonWithTooltip>
                    ) : (
                      <Button
                        onClick={handleCompleteTraining}
                        className={cn("transition-all duration-500 animate-scale-in")}
                      >
                        Complete Training
                      </Button>
                    )}
                  </div>
                </>
              )}
          </DialogFooter>
        )}
      </FullscreenDialogContent>
    </Dialog>;
};