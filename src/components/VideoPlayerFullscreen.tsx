import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  FullscreenDialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Clock } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { TrainingAttestation } from "@/components/shared/TrainingAttestation";
import { quizOperations } from "@/services/quizService";
import { progressOperations } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { QuizSubmissionData, QuizResponse, QuizWithQuestions, QuizDraftResponse } from "@/types/quiz";
import type { Video, TrainingContent } from "@/types";
import { logger } from "@/utils/logger";
import { QuizModal } from "@/components/quiz/QuizModal";
import { ContentPlayer } from "@/components/content/ContentPlayer";
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
  initialVideo,
}) => {
  // State management
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
  const [videoAttestationChecked, setVideoAttestationChecked] = useState(false);
  const [showVideoCompletedBadge, setShowVideoCompletedBadge] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [draftResponses, setDraftResponses] = useState<QuizDraftResponse[] | null>(null);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const badgeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Presentation compliance states
  const [viewingSeconds, setViewingSeconds] = useState(0);
  const viewingSecondsRef = useRef(0);
  const [checkboxEnabled, setCheckboxEnabled] = useState(false);
  const [presentationAcknowledged, setPresentationAcknowledged] = useState(false);
  const [a11yAnnouncement, setA11yAnnouncement] = useState("");

  // Hooks for authentication and user feedback
  const { user } = useAuth();
  const { toast } = useToast();

  // Custom hooks for data management
  const { video, quiz, videoLoading: vLoading, quizLoading, loadVideoData, resetVideoData } = useVideoData();
  const { progress, isCompleted, wasEverCompleted, furthestWatchedSeconds, lastPositionSeconds, updateFurthestWatched, updateLastPosition, updateProgress, resetProgress, flushLastPosition, loadExistingProgress, markComplete } =
    useVideoProgress({
      videoId,
      userEmail: user?.email || null,
      onProgressUpdate,
      hasQuiz: quizLoading || !!quiz,
    });

  // Presentation timer constants and computed values
  const presentationMinSeconds = video?.duration_seconds && video.duration_seconds >= 60 ? video.duration_seconds : 60;
  const isPresentation = video?.content_type === "presentation";
  const remainingSeconds = isPresentation ? Math.max(0, presentationMinSeconds - viewingSeconds) : 0;
  const timerActive = remainingSeconds > 0;
  const formattedTime = `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, "0")}`;

  // Derived: video is ready for completion actions
  const videoReady = !isPresentation && progress >= 99;

  // Effect to load video data and existing progress when modal opens
  useEffect(() => {
    const initializeVideo = async () => {
      if (!open || !videoId) {
        // Flush position to DB before resetting state
        await flushLastPosition();
        resetVideoData();
        resetProgress();
        setQuizStarted(false);
        setQuizSubmitted(false);
        setQuizResults([]);
        setCompletedQuizResults([]);
        setCompletedQuiz(null);
        setVideoAttestationChecked(false);
        setIsInitializing(true);
        return;
      }
      setIsInitializing(true);
      try {
        const loadResult = await loadVideoData(videoId, initialVideo);
        if (!loadResult.success) {
          toast({
            title: "Video Loading Error",
            description: "Unable to load video details. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (user?.email) {
          const existingProgress = await loadExistingProgress();
          
          // Restore timer from persisted viewing seconds
          const loadedVideo = ('data' in loadResult ? loadResult.data : null) || initialVideo;
          console.log('[Timer Debug] loadedVideo:', loadedVideo?.content_type, 'duration:', loadedVideo?.duration_seconds);
          console.log('[Timer Debug] existingProgress:', existingProgress?.acknowledgmentViewingSeconds);
          if (loadedVideo?.content_type === 'presentation'
              && existingProgress?.acknowledgmentViewingSeconds != null
              && existingProgress.acknowledgmentViewingSeconds > 0) {
            setViewingSeconds(existingProgress.acknowledgmentViewingSeconds);
            const minSeconds = loadedVideo.duration_seconds && loadedVideo.duration_seconds >= 60
              ? loadedVideo.duration_seconds : 60;
            if (existingProgress.acknowledgmentViewingSeconds >= minSeconds) {
              setCheckboxEnabled(true);
            }
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };
    initializeVideo();
  }, [
    open,
    videoId,
    user?.email,
    loadVideoData,
    resetVideoData,
    resetProgress,
    flushLastPosition,
    loadExistingProgress,
    toast,
    initialVideo,
  ]);

  // Scroll reset on open or video change
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [open, videoId]);

  // Timer effect for presentations
  useEffect(() => {
    if (!open || !video || video.content_type !== "presentation" || checkboxEnabled) {
      return;
    }
    const timer = setInterval(() => {
      setViewingSeconds((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds >= presentationMinSeconds && !checkboxEnabled) {
          setCheckboxEnabled(true);
          setA11yAnnouncement(
            `You may now acknowledge that you have reviewed this training material after viewing for ${presentationMinSeconds} seconds.`,
          );
          logger.info("Presentation acknowledgment unlocked", {
            videoId,
            viewingSeconds: newSeconds,
            minimumRequired: presentationMinSeconds,
          });
        }
        return newSeconds;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, video, checkboxEnabled, videoId]);

  // Keep ref in sync with viewingSeconds state
  useEffect(() => {
    viewingSecondsRef.current = viewingSeconds;
  }, [viewingSeconds]);

  // Periodic save of viewing seconds for presentations
  useEffect(() => {
    if (!open || !video || video.content_type !== 'presentation' || !user?.email || !videoId) return;

    const saveInterval = setInterval(async () => {
      const currentSeconds = viewingSecondsRef.current;
      if (currentSeconds > 0) {
        console.log('[Timer Sync] Attempting save, seconds:', currentSeconds);
        const result = await progressOperations.updateByEmail(
          user.email!, videoId, 0, undefined, undefined, currentSeconds
        );
        if (result.success) {
          console.log('[Timer Sync] Successfully saved seconds:', currentSeconds);
        } else {
          console.error('[Timer Sync] Failed to save:', result.error);
        }
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [open, video, user?.email, videoId]);

  // Reset presentation states and badge when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setViewingSeconds(0);
      setCheckboxEnabled(false);
      setPresentationAcknowledged(false);
      setA11yAnnouncement("");
      setShowVideoCompletedBadge(false);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
    }
  }, [open]);

  // Auto-scroll to attestation/quiz area when video completes (VIDEO ONLY)
  useEffect(() => {
    if (!isPresentation && videoReady && !wasEverCompleted) {
      setTimeout(() => {
        const el = document.getElementById("attestation-section");
        if (el && scrollRef.current) {
          scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
        }
      }, 200);
    }
  }, [videoReady, isPresentation, wasEverCompleted]);

  // Load completed quiz results
  useEffect(() => {
    const loadCompletedQuizResults = async () => {
      if (!wasEverCompleted || !user?.email || !videoId) return;
      try {
        const attempts = await quizOperations.getUserAttempts(user.email);
        const videoQuizAttempts = attempts.filter((attempt) => attempt.quiz.video_id === videoId);
        const latestAttempt = videoQuizAttempts[0];

        if (latestAttempt) {
          setStoredAttemptScore(latestAttempt.score);
          setStoredAttemptTotal(latestAttempt.total_questions);

          const attemptQuiz = await quizOperations.getById(latestAttempt.quiz_id);
          if (attemptQuiz) {
            setCompletedQuiz(attemptQuiz);
          }

          if (latestAttempt.responses) {
            setCompletedQuizResults(latestAttempt.responses);
          }

          const correctOpts = await quizOperations.getCorrectOptionsForQuiz(latestAttempt.quiz_id);
          setCorrectOptions(correctOpts);
        }
      } catch (error) {
        logger.warn("Failed to load completed quiz results", { videoId, error });
      }
    };
    loadCompletedQuizResults();
  }, [wasEverCompleted, user?.email, videoId]);

  // Auto-start quiz when reopening at 99%+ with quiz, and load draft
  useEffect(() => {
    if (!open || quizStarted || wasEverCompleted) return;
    if (progress >= 99 && quiz && !quizLoading) {
      // Load draft before starting quiz
      const loadDraft = async () => {
        if (user?.email) {
          const draft = await quizOperations.getDraft(user.email, quiz.id);
          setDraftResponses(draft);
        }
        setQuizStarted(true);
        setTimeout(() => {
          const el = document.getElementById("quiz-section");
          if (el && scrollRef.current) {
            scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
          }
        }, 100);
      };
      loadDraft();
    }
  }, [open, progress, quiz, quizLoading, quizStarted, wasEverCompleted, user?.email]);

  const handleVideoEnded = useCallback(() => {
    const finalProgress = 99;
    updateProgress(finalProgress);
    // Show transient success badge for videos
    if (!isPresentation) {
      setShowVideoCompletedBadge(true);
      badgeTimeoutRef.current = setTimeout(() => setShowVideoCompletedBadge(false), 5000);
    }
  }, [updateProgress, quiz, isPresentation]);

  const handleCompleteTraining = useCallback(async () => {
    if (video?.content_type === "presentation" && !presentationAcknowledged) {
      toast({
        variant: "destructive",
        title: "Acknowledgment Required",
        description: "Please confirm that you have reviewed the training material.",
      });
      return;
    }
    await markComplete();
    if (video?.content_type === "presentation" && user?.email && videoId) {
      await progressOperations.updateByEmail(user.email, videoId, 100, new Date(), new Date(), viewingSeconds);
    }
    setVideoAttestationChecked(false);
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed this training.",
    });
    onProgressUpdate?.(100);
    onOpenChange(false);
  }, [
    video,
    presentationAcknowledged,
    markComplete,
    user,
    videoId,
    viewingSeconds,
    toast,
    onProgressUpdate,
    onOpenChange,
  ]);

  const handleQuizSubmit = useCallback(async () => {
    if (!quiz || !user?.email || !quizResponses.length) {
      logger.warn("Cannot submit quiz: missing quiz, user, or responses", {
        hasQuiz: !!quiz,
        hasUser: !!user?.email,
        hasResponses: quizResponses.length > 0,
      });
      return;
    }
    try {
      const attemptId = await quizOperations.submitQuiz(user.email, quiz.id, quizResponses);
      // Delete draft after successful submission
      await quizOperations.deleteDraft(user.email, quiz.id);
      const [attempts, correctOpts] = await Promise.all([
        quizOperations.getUserAttempts(user.email),
        quizOperations.getCorrectOptionsForQuiz(quiz.id),
      ]);
      const currentAttempt = attempts.find((attempt) => attempt.id === attemptId);
      if (currentAttempt?.responses) {
        setQuizResults(currentAttempt.responses);
      }
      setCorrectOptions(correctOpts);
      logger.info("Quiz submitted successfully", { quizId: quiz.id, videoId: video?.id, userEmail: user.email });
      setQuizSubmitted(true);
      await markComplete();
      toast({ title: "Quiz Submitted! 📝", description: "Review your answers." });
    } catch (error) {
      logger.error("Failed to submit quiz", error);
      toast({
        title: "Quiz Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    }
  }, [quiz, user?.email, video?.id, toast, quizResponses, markComplete]);

  // Attestation state for quiz flow
  const [quizAttestationChecked, setQuizAttestationChecked] = useState(false);

  const handleStartQuiz = useCallback(async () => {
    if (wasEverCompleted) return;
    // Load draft before starting
    if (user?.email && quiz) {
      const draft = await quizOperations.getDraft(user.email, quiz.id);
      setDraftResponses(draft);
    }
    setQuizStarted(true);
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
    setQuizAttestationChecked(false);
    setTimeout(() => {
      const el = document.getElementById("quiz-section");
      if (el && scrollRef.current) {
        scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
      }
    }, 100);
  }, [wasEverCompleted, user?.email, quiz]);

  // Debounced draft save handler
  const handleDraftSave = useCallback((drafts: QuizDraftResponse[]) => {
    if (!user?.email || !quiz) return;
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(() => {
      quizOperations.saveDraft(user.email!, quiz.id, drafts);
    }, 2000);
  }, [user?.email, quiz]);

  const handleQuizResponsesChange = useCallback(
    (responses: QuizSubmissionData[], allAnswered: boolean, attestationChecked: boolean) => {
      setQuizResponses(responses);
      setAllQuestionsAnswered(allAnswered);
      setQuizAttestationChecked(attestationChecked);
      const hasAnyResponses = responses.some((response) => response.selected_option_id || response.text_answer?.trim());
      setHasQuizChanges(hasAnyResponses);
    },
    [],
  );

  const handleCancelClick = useCallback(() => {
    if (quizSubmitted) {
      setQuizStarted(false);
      return;
    }
    setShowCancelConfirmation(true);
  }, [quizSubmitted]);

  const handleConfirmedCancel = useCallback(async () => {
    setShowCancelConfirmation(false);
    // Flush draft save immediately before closing
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = undefined;
    }
    // Save current quiz responses as draft if any exist
    if (user?.email && quiz && quizResponses.length > 0) {
      const drafts: QuizDraftResponse[] = quizResponses
        .filter(r => r.selected_option_id || r.text_answer?.trim())
        .map(r => ({ question_id: r.question_id, selected_option_id: r.selected_option_id, text_answer: r.text_answer }));
      if (drafts.length > 0) {
        await quizOperations.saveDraft(user.email, quiz.id, drafts);
      }
    }
    setQuizStarted(false);
    setQuizResponses([]);
    setAllQuestionsAnswered(false);
    setHasQuizChanges(false);
    setQuizSubmitted(false);
    setQuizResults([]);
    setCompletedQuizResults([]);
    setQuizAttestationChecked(false);
    setDraftResponses(null);
    await flushLastPosition();
    onOpenChange(false);
  }, [onOpenChange, flushLastPosition, user?.email, quiz, quizResponses]);

  const handleDialogOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && !wasEverCompleted && !quizSubmitted) {
        if (quizStarted) {
          setShowCancelConfirmation(true);
        } else {
          setCancelDialogOpen(true);
        }
        return;
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, wasEverCompleted, quizSubmitted, quizStarted],
  );

  const trainingContent = useMemo<TrainingContent | null>(() => {
    if (!video) return null;
    if (!video.id || !video.title) {
      logger.warn("Video missing required fields", { videoId: video?.id, hasTitle: !!video?.title });
      return null;
    }
    if (!video.video_url && !video.video_file_name) {
      logger.warn("Video missing both video_url and video_file_name", { videoId: video.id });
      return null;
    }
    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      video_url: video.video_url || null,
      video_file_name: video.video_file_name || null,
      type: video.type || "Optional",
      content_type: video.content_type || "video",
      duration_seconds: video.duration_seconds || 0,
      completion_rate: video.completion_rate || 0,
      created_at: video.created_at || new Date().toISOString(),
      updated_at: video.updated_at || new Date().toISOString(),
      archived_at: video.archived_at || null,
    };
  }, [video]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <FullscreenDialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => {
            const videoContainer = document.querySelector("[data-video-container]") as HTMLElement;
            if (videoContainer) {
              videoContainer.focus();
            }
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
            }
          }, 100);
        }}
        aria-describedby="video-description"
      >
        {/* Fixed Header */}
        <DialogHeader>
          <DialogTitle>{video?.title || "Training Video"}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6"
          data-dialog-scroll-area
        >
          {video?.description && video.description.trim() !== "" && (
            <div id="video-description">
              <p className="text-body text-foreground">{video.description}</p>
            </div>
          )}

          <div
            className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0 relative"
            data-video-container
            tabIndex={0}
            aria-label="Video player. Press spacebar to play or pause."
            role="application"
          >
            {trainingContent && (
              <ContentPlayer
                content={trainingContent}
                loading={vLoading}
                progress={progress}
                onProgressUpdate={updateProgress}
                onComplete={handleVideoEnded}
                furthestWatchedSeconds={furthestWatchedSeconds}
                onFurthestUpdate={updateFurthestWatched}
                initialSeekSeconds={lastPositionSeconds}
                onLastPositionUpdate={updateLastPosition}
              />
            )}
          </div>

          {/* Compliance Checkbox - Only for Presentations */}
          {video && video.content_type === "presentation" && !wasEverCompleted && !quiz && !quizLoading && (
            <div>
              <TrainingAttestation
                enabled={checkboxEnabled}
                checked={presentationAcknowledged}
                onCheckedChange={setPresentationAcknowledged}
                disabledTooltip="Please wait for the viewing timer to complete."
              />
            </div>
          )}

          {/* Attestation for non-quiz video trainings */}
          {videoReady && !wasEverCompleted && !quiz && !quizLoading && (
            <TrainingAttestation
              enabled={true}
              checked={videoAttestationChecked}
              onCheckedChange={setVideoAttestationChecked}
              disabledTooltip=""
            />
          )}

          {/* Quiz Section */}
          {((quizStarted && quiz) ||
            (wasEverCompleted && (completedQuiz || quiz) && completedQuizResults.length > 0)) && (
            <div id="quiz-section" className="mt-8 border-t pt-8 pb-10">
              <QuizModal
                quiz={wasEverCompleted && completedQuiz ? completedQuiz : quiz!}
                onSubmit={handleQuizSubmit}
                onCancel={() => {}}
                onResponsesChange={handleQuizResponsesChange}
                onDraftSave={handleDraftSave}
                initialDraftResponses={!wasEverCompleted && !quizSubmitted ? draftResponses : null}
                quizResults={wasEverCompleted ? completedQuizResults : quizResults}
                isSubmitted={wasEverCompleted || quizSubmitted}
                correctOptions={correctOptions}
                storedScore={wasEverCompleted ? storedAttemptScore : undefined}
                storedTotalQuestions={wasEverCompleted ? storedAttemptTotal : undefined}
              />

              {/* Attestation - inline after quiz questions */}
              {!quizSubmitted && !wasEverCompleted && (
                <div className="mt-6 max-w-4xl mx-auto">
                  <TrainingAttestation
                    enabled={allQuestionsAnswered}
                    checked={quizAttestationChecked}
                    onCheckedChange={setQuizAttestationChecked}
                    disabledTooltip="Complete the questions above to enable this checkbox."
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unified Footer */}
        {!wasEverCompleted && !isInitializing && (
          <DialogFooter>
            {(() => {
              // State: quiz-done
              if (quizSubmitted) {
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <div />
                    <DialogClose asChild>
                      <Button>Close</Button>
                    </DialogClose>
                  </div>
                );
              }

              // State: quiz-active
              if (quizStarted) {
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <div />
                    <div className="flex gap-4">
                    <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" onClick={handleCancelClick}>
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Exit training?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div>
                          <AlertDialogDescription>
                            Your training will remain incomplete but your quiz progress will be saved. You can resume where you left off.
                          </AlertDialogDescription>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Return to Quiz</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmedCancel}>
                            Exit Training
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {!allQuestionsAnswered || !quizAttestationChecked ? (
                      <ButtonWithTooltip
                        tooltip="Complete the questions above and the final acknowledgement to submit."
                        disabled
                      >
                        Submit Quiz
                      </ButtonWithTooltip>
                    ) : (
                      <Button onClick={handleQuizSubmit}>Submit Quiz</Button>
                    )}
                    </div>
                  </div>
                );
              }

              // State: content (all 4 use cases)
              const contentDone = isPresentation ? !timerActive : videoReady;
              const attestationChecked = isPresentation ? presentationAcknowledged : videoAttestationChecked;

              const getPrimaryTooltip = () => {
                if (!contentDone) {
                  return isPresentation ? "Finish viewing to continue." : "Watch video to continue.";
                }
                if (!quiz && !quizLoading && !attestationChecked) {
                  return "Check the acknowledgement box above to proceed.";
                }
                return "";
              };

              const primaryTooltip = getPrimaryTooltip();
              const primaryLabel = quiz && !quizLoading ? "Start Quiz to Complete Training" : "Complete Training";
              const primaryDisabled = quiz && !quizLoading ? !contentDone : !contentDone || !attestationChecked;

              const cancelTitle = "Exit training?";
              const cancelDescription = contentDone
                ? "You haven't submitted the acknowledgement yet and your training will remain incomplete."
                : "Your training will remain incomplete but your video progress will be saved. You can resume where you left off.";

              return (
                <div className="flex w-full items-center justify-between gap-4">
                  {/* Left zone: timer, badge, or empty */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPresentation && timerActive && (
                      <Banner variant="information" size="compact" icon={Clock} className="w-fit shrink-0">
                        <span className="tabular-nums whitespace-nowrap">Minimum Review Time: {formattedTime}</span>
                      </Banner>
                    )}
                    {isPresentation && !timerActive && (
                      <Banner variant="success" size="compact" className="w-fit shrink-0">
                        Minimum Time Met
                      </Banner>
                    )}
                    {!isPresentation && showVideoCompletedBadge && (
                      <Banner variant="success" size="compact" className="w-fit shrink-0 animate-fade-in">
                        Video Completed! ✅
                      </Banner>
                    )}
                  </div>

                  {/* Right zone: Cancel + Primary */}
                  <div className="flex gap-4">
                    <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{cancelTitle}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div>
                          <AlertDialogDescription>{cancelDescription}</AlertDialogDescription>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Return to Training</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              setCancelDialogOpen(false);
                              await flushLastPosition();
                              onOpenChange(false);
                            }}
                          >
                            Exit Training
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {/* If quiz auto-start is imminent, suppress the "Start Quiz" button to prevent flash */}
                    {quizLoading ||
                    isInitializing ||
                    (!isPresentation &&
                      progress >= 99 &&
                      quiz &&
                      !quizLoading &&
                      !quizStarted) ? null : primaryDisabled ? (
                      <ButtonWithTooltip tooltip={primaryTooltip} disabled className="transition-all duration-500">
                        {primaryLabel}
                      </ButtonWithTooltip>
                    ) : (
                      <Button
                        onClick={quiz && !quizLoading ? handleStartQuiz : handleCompleteTraining}
                        className="transition-all duration-500 animate-scale-in"
                      >
                        {primaryLabel}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </DialogFooter>
        )}
      </FullscreenDialogContent>
    </Dialog>
  );
};
