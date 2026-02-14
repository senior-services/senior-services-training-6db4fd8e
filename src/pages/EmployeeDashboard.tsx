/**
 * Enhanced EmployeeDashboard Component for the Senior Services Training Portal
 * Implements accessibility, security, performance, and modern UX best practices
 */

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { TrainingCard, TrainingVideo } from "@/components/TrainingCard";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BookOpen, AlertCircle, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { assignmentOperations, progressOperations } from "@/services/api";
import { quizOperations } from "@/services/quizService";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types";
import type { QuizAttemptWithDetails } from "@/types/quiz";
import { logger, performanceTracker } from "@/utils/logger";
import { handleError, withErrorHandler } from "@/utils/errorHandler";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Enhanced utility imports
import { sanitizeText, createSafeDisplayName, validateUserRole } from "@/utils/security";
import { announceToScreenReader, getStatusAnnouncement, formatDurationSeconds } from "@/utils/accessibility";
import { isLegacyExempt, hasActiveQuizRequirement } from "@/utils/quizHelpers";
import {
  calculateTrainingProgress,
  useOptimizedMemo,
  useOptimizedCallback,
  usePerformanceMonitor } from
"@/utils/performance";

/**
 * Enhanced props interface with comprehensive type safety
 */
interface EmployeeDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onPlayVideo: (videoId: string, initialVideo?: Video) => void;
  refreshTrigger?: number;
}

/**
 * Enhanced training progress statistics interface
 */
interface TrainingStats {
  totalVideos: number;
  completedVideos: number;
  overallProgress: number;
  requiredComplete: number;
  totalRequired: number;
  overallStatus: "on-track" | "behind" | "completed" | "needs-attention";
}

/**
 * Enhanced EmployeeDashboard component with comprehensive accessibility and performance optimizations
 */
export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  userName,
  userEmail,
  onLogout,
  onPlayVideo,
  refreshTrigger = 0
}) => {
  // Performance monitoring
  usePerformanceMonitor("EmployeeDashboard");

  // Enhanced state management with better typing
  const [assignedVideoData, setAssignedVideoData] = useState<
    {
      video: Video;
      assignment: any;
    }[]>(
    []);
  const [quizAttemptsByVideo, setQuizAttemptsByVideo] = useState<Record<string, QuizAttemptWithDetails | undefined>>(
    {}
  );
  const [videoIdsWithQuizzes, setVideoIdsWithQuizzes] = useState<Map<string, {createdAt: string;questionCount: number;}>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const reloadTimer = React.useRef<number | null>(null);

  // Sanitize and validate user data for security
  const sanitizedUserData = useMemo(
    () => ({
      displayName: createSafeDisplayName(userName, userEmail),
      firstName: createSafeDisplayName(userName, userEmail).split(" ")[0],
      email: userEmail // Already validated by auth system
    }),
    [userName, userEmail]
  );

  // Load assigned videos with enhanced error handling
  const loadAssignedVideos = useOptimizedCallback(
    async (opts?: {silent?: boolean;}) => {
      performanceTracker.start("loadAssignedVideos");
      const loadResult = await withErrorHandler(
        async () => {
          if (!opts?.silent) setLoading(true);
          setError(null);
          const res = await assignmentOperations.getByEmployeeEmail(userEmail);
          const videoData = res.success && res.data ? res.data : [];
          setAssignedVideoData(videoData);

          // Fetch quiz attempts for the user
          try {
            const attempts = await quizOperations.getUserAttempts(userEmail);
            if (attempts && attempts.length > 0) {
              // Create a map of video_id -> latest quiz attempt
              const attemptsByVideo = attempts.reduce(
                (acc, attempt) => {
                  const videoId = attempt.quiz.video_id;
                  if (!acc[videoId] || new Date(attempt.completed_at) > new Date(acc[videoId].completed_at)) {
                    acc[videoId] = attempt;
                  }
                  return acc;
                },
                {} as Record<string, QuizAttemptWithDetails>
              );
              setQuizAttemptsByVideo(attemptsByVideo);
            } else {
              setQuizAttemptsByVideo({});
            }
          } catch (error) {
            logger.error("Failed to load quiz attempts", error as Error);
            // Don't fail the entire load if quiz attempts fail
            setQuizAttemptsByVideo({});
          }

          // Fetch which videos have quizzes with their creation dates and question counts
          try {
            const { data: quizzesData } = await supabase.
            from("quizzes").
            select("video_id, created_at, quiz_questions(count)").
            is("archived_at", null);
            const quizMap = new Map<string, {createdAt: string;questionCount: number;}>();
            quizzesData?.forEach((q) => {
              const questionCount = (q.quiz_questions as any)?.[0]?.count ?? 0;
              quizMap.set(q.video_id, { createdAt: q.created_at, questionCount });
            });
            setVideoIdsWithQuizzes(quizMap);
          } catch (error) {
            logger.warn("Failed to load quiz video IDs", { error });
          }

          // Data reconciliation: Update video_progress for completed quizzes
          try {
            const attempts = await quizOperations.getUserAttempts(userEmail);
            if (attempts && attempts.length > 0) {
              for (const attempt of attempts) {
                const videoId = attempt.quiz.video_id;
                const correspondingAssignment = videoData.find((item) => item.video.id === videoId);

                // If quiz is completed but video progress is less than 100%, update it
                const assignmentProgress = (correspondingAssignment.assignment as any)?.progress_percent || 0;
                if (correspondingAssignment && assignmentProgress < 100) {
                  try {
                    await progressOperations.updateByEmail(userEmail, videoId, 100, new Date(attempt.completed_at));
                  } catch (updateError) {
                    // Silent failure for reconciliation
                    logger.warn("Failed to reconcile video progress for quiz completion", {
                      videoId,
                      userEmail,
                      error: updateError instanceof Error ? updateError.message : String(updateError)
                    });
                  }
                }
              }
            }
          } catch (error) {
            // Silent failure for reconciliation
            logger.warn("Failed to reconcile quiz completion with video progress", {
              error: error instanceof Error ? error.message : String(error)
            });
          }

          logger.info("Successfully loaded assigned videos", {
            videoCount: videoData.length,
            userEmail
          });

          // Announce successful load to screen readers only on non-silent loads
          if (!opts?.silent) {
            announceToScreenReader(`Loaded ${videoData.length} assigned training videos`);
          }
          return videoData;
        },
        {
          operation: "loadAssignedVideos",
          userEmail
        },
        "Failed to load your assigned videos. Please try refreshing the page."
      );
      if (!loadResult.success) {
        const errorMessage = "Failed to load your assigned videos. Please try refreshing the page.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });

        // Announce error to screen readers
        if (!opts?.silent) announceToScreenReader(errorMessage, "assertive");
      }
      performanceTracker.end("loadAssignedVideos");
      if (!opts?.silent) setLoading(false);
    },
    [userEmail, toast]
  );

  // Enhanced video data transformation with security and accessibility
  const transformToTrainingVideo = useOptimizedCallback(
    (video: Video, assignment?: any): TrainingVideo => {
      logger.debug("Transforming video data for display", {
        videoId: video.id,
        videoTitle: video.title,
        hasDescription: !!video.description,
        hasAssignment: !!assignment,
        userEmail
      });

      // Simple duration formatter (inline to fix runtime error)
      const formatSeconds = (seconds: number): string => {
        if (seconds === 0) return "0 minutes";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
          return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
          return `${hours} hour${hours !== 1 ? "s" : ""}`;
        }
        return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
      };

      // Get quiz summary if available
      const quizAttempt = quizAttemptsByVideo[video.id];
      const quizSummary = quizAttempt ?
      {
        correct: quizAttempt.score,
        total: quizAttempt.total_questions,
        percent: Math.round(quizAttempt.score / quizAttempt.total_questions * 100),
        completedAt: quizAttempt.completed_at
      } :
      undefined;

      // Quiz-aware completion logic (aligned with admin dashboard)
      const videoMarkedComplete = assignment?.completed_at || assignment?.progress_percent === 100;
      const quizInfo = videoIdsWithQuizzes.get(video.id);
      const quizCreatedAt = quizInfo?.createdAt;
      // Use shared helper for legacy exemption check
      const hasQuiz = hasActiveQuizRequirement(quizCreatedAt, assignment?.completed_at);
      const quizDone = quizAttemptsByVideo[video.id] != null;

      let effectiveProgress: number;
      let effectiveCompletedAt: string | null = assignment?.completed_at ?? null;
      let quizPending = false;

      if (hasQuiz) {
        if (videoMarkedComplete && quizDone) {
          effectiveProgress = 100;
          effectiveCompletedAt = effectiveCompletedAt || quizAttemptsByVideo[video.id]?.completed_at || null;
        } else {
          effectiveProgress = Math.max(0, Math.min(100, assignment?.progress_percent || 0));
          effectiveCompletedAt = null;
          if (videoMarkedComplete && !quizDone) {
            quizPending = true;
          }
        }
      } else {
        effectiveProgress = videoMarkedComplete ?
        100 :
        Math.max(0, Math.min(100, assignment?.progress_percent || 0));
      }

      return {
        id: video.id,
        title: sanitizeText(video.title || "Untitled Video"),
        description: sanitizeText(video.description || ""),
        thumbnail: video.thumbnail_url || "",
        duration: formatSeconds(video.duration_seconds || 0),
        progress: effectiveProgress,
        isRequired: video.type === "Required",
        deadline: assignment?.due_date ? new Date(assignment.due_date).toLocaleDateString() : undefined,
        dueDate: assignment?.due_date || null,
        status: !video.video_url && !video.video_file_name ? "warning" as const : undefined,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        video_file_name: video.video_file_name,
        quizPending,
        quizSummary,
        quizQuestionCount: hasQuiz ? quizInfo?.questionCount : undefined,
        completedAt: effectiveCompletedAt || undefined
      };
    },
    [userEmail, quizAttemptsByVideo, videoIdsWithQuizzes]
  );

  // Enhanced training data processing with comprehensive statistics
  const trainingData = useOptimizedMemo(() => {
    performanceTracker.start("processTrainingData");
    logger.debug("Processing assigned video data", {
      totalAssignments: assignedVideoData.length,
      userEmail
    });
    const allRequiredVideos = assignedVideoData.
    filter((item) => item.video.type === "Required").
    map((item) => transformToTrainingVideo(item.video, item.assignment));

    // Separate completed and incomplete required videos
    const incompleteVideos = allRequiredVideos.filter((video) => video.progress < 100);
    const completedVideos = allRequiredVideos.
    filter((video) => video.progress >= 100).
    sort((a, b) => {
      if (!a.completedAt && !b.completedAt) return 0;
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

    // Sort incomplete videos by due date (soonest first)
    const requiredVideos = incompleteVideos.sort((a, b) => {
      // Videos without due dates go to the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      // Sort by due date (earliest first)
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
    logger.info("Training progress calculated", {
      requiredIncomplete: requiredVideos.length,
      completed: completedVideos.length,
      totalRequired: allRequiredVideos.length,
      userEmail
    });

    // Calculate comprehensive training statistics using all required videos
    const stats = calculateTrainingProgress(allRequiredVideos);

    // Determine overall status for accessibility announcements
    let overallStatus: TrainingStats["overallStatus"] = "on-track";
    if (stats.totalRequired === 0) {
      overallStatus = "completed";
    } else if (stats.requiredComplete === stats.totalRequired) {
      overallStatus = "completed";
    } else if (stats.overallProgress < 50) {
      overallStatus = "behind";
    } else {
      // Check for overdue items
      const hasOverdue = requiredVideos.some((video) => {
        if (!video.dueDate) return false;
        const due = new Date(video.dueDate);
        return due < new Date() && video.progress < 100;
      });
      overallStatus = hasOverdue ? "needs-attention" : "on-track";
    }
    return {
      required: requiredVideos,
      completed: completedVideos,
      stats: {
        ...stats,
        overallStatus
      } as TrainingStats
    };
  }, [assignedVideoData, transformToTrainingVideo]);

  const handlePlayVideo = useOptimizedCallback(
    (videoId: string) => {
      const video =
      trainingData.required.find((v) => v.id === videoId) || trainingData.completed.find((v) => v.id === videoId);
      logger.videoEvent("employee_video_selected", videoId, {
        videoTitle: video?.title,
        hasDescription: !!video?.description,
        userEmail,
        videoFound: !!video
      });
      if (video) {
        const announcement = `Opening ${video.title}. ${getStatusAnnouncement(video.progress, video.isRequired || false, video.dueDate)}`;
        announceToScreenReader(announcement);

        // Find the original Video object for faster loading
        const originalVideo = assignedVideoData.find((item) => item.video.id === videoId)?.video;
        onPlayVideo(videoId, originalVideo);
      } else {
        logger.warn("Video not found when attempting to play", {
          videoId,
          userEmail
        });
        onPlayVideo(videoId); // Fallback without original video
      }
    },
    [trainingData.required, trainingData.completed, onPlayVideo, userEmail, assignedVideoData]
  );

  // Callback to refresh training data when progress is updated
  const handleProgressUpdate = (progress: number) => {
    logger.videoEvent("progress_updated_callback", "unknown", {
      progress,
      userEmail,
      timestamp: new Date().toISOString()
    });

    // Optionally refresh the training data to show updated progress
    loadAssignedVideos({ silent: true });
  };

  // Load videos on component mount and set up realtime subscriptions
  useEffect(() => {
    loadAssignedVideos();

    // Set up realtime subscription for video progress updates with error handling
    let channel: any = null;
    try {
      channel = supabase.
      channel("video-progress-changes").
      on(
        "postgres_changes",
        {
          event: "*",
          // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "video_progress"
        },
        (payload) => {
          logger.info("Real-time video progress update received", {
            event: payload.eventType,
            table: payload.table,
            userEmail,
            timestamp: new Date().toISOString()
          });

          // Debounce refreshes to prevent rapid re-fetch loops
          if (reloadTimer.current) {
            window.clearTimeout(reloadTimer.current);
          }
          reloadTimer.current = window.setTimeout(() => {
            loadAssignedVideos({ silent: true });
            reloadTimer.current = null;
          }, 500);
        }
      ).
      subscribe();
    } catch (error) {
      // Silently fail if WebSockets aren't available (e.g., in insecure contexts)
      logger.error("Failed to set up real-time subscription for video progress", error as Error);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Silently fail on cleanup
          logger.error("Failed to remove channel", error as Error);
        }
      }
      if (reloadTimer.current) {
        window.clearTimeout(reloadTimer.current);
        reloadTimer.current = null;
      }
    };
  }, [loadAssignedVideos]);

  // Refresh when refreshTrigger changes (e.g., when video modal closes)
  useEffect(() => {
    if (refreshTrigger > 0) {
      logger.info("Dashboard refresh triggered by external event", {
        refreshTrigger,
        userEmail,
        timestamp: new Date().toISOString()
      });

      // Force reload assigned videos with cache bypass
      loadAssignedVideos({ silent: true });
    }
  }, [refreshTrigger, loadAssignedVideos]);

  // Error boundary fallback
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header
          userRole="employee"
          userName={sanitizedUserData.displayName}
          userEmail={userEmail}
          onLogout={onLogout}
          currentView="dashboard" />


        <main className="container mx-auto px-4 py-8" role="main" aria-labelledby="error-heading">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" aria-hidden="true" />
            <h2 id="error-heading" className="mb-2">
              Unable to Load Training Data
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => loadAssignedVideos()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-describedby="retry-description">

              Try Again
            </button>
            <p id="retry-description" className="sr-only">
              Click to retry loading your training assignments
            </p>
          </div>
        </main>
      </div>);

  }
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-muted/30">
        <Header
          userRole="employee"
          userName={sanitizedUserData.displayName}
          userEmail={userEmail}
          onLogout={onLogout}
          currentView="dashboard" />


        <main className="container mx-auto px-4 py-8" role="main" aria-labelledby="dashboard-heading">
          {/* Skip Navigation Link for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                       bg-primary text-primary-foreground px-4 py-2 rounded-md z-50
                       focus:outline-none focus:ring-2 focus:ring-ring">

            Skip to main content
          </a>

          {/* Enhanced Welcome Section with Status Information */}
          <header className="mb-8" role="banner">
            <div className="mb-4">
              <h1 id="dashboard-heading" className="text-h2 text-foreground">
                Welcome back, {sanitizedUserData.firstName}!
              </h1>
            </div>

            



            {/* Training Statistics for Screen Readers */}
            <div className="sr-only" aria-live="polite">
              <p>
                Training Progress: {trainingData.stats.requiredComplete} of {trainingData.stats.totalRequired} required
                training modules completed. Overall progress: {trainingData.stats.overallProgress} percent.
              </p>
            </div>
          </header>

          {/* Required Training Section with Enhanced Accessibility */}
          <section id="main-content" className="mb-12" aria-labelledby="required-training-heading" role="region">
            <div className="flex items-center gap-3 mb-6">
              <h2
                id="required-training-heading"
                className="text-h3 text-foreground flex items-center">

                <Clock className="w-6 h-6 text-primary mr-3" aria-hidden="true" />
                Required Trainings
              </h2>
              {trainingData.required.length > 0 &&
              <Badge variant="soft-primary">{trainingData.required.length}</Badge>
              }
            </div>
            {loading ?
            <div
              className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              aria-label="Loading training assignments">

                {Array.from({
                length: 6
              }).map((_, index) =>
              <LoadingSkeleton key={index} lines={1} className="h-64" />
              )}
              </div> :
            trainingData.required.length === 0 ?
            <div className="text-center py-12" role="status" aria-live="polite">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <h3 className="mb-2">No Required Trainings Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have any required trainings assigned at this time.
                </p>
              </div> :

            <div
              className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              role="grid"
              aria-label="Required training videos">

                {trainingData.required.map((video, index) =>
              <TrainingCard
                key={video.id}
                video={video}
                onPlay={handlePlayVideo}
                priority={index < 3} // Prioritize first 3 cards for performance
              />
              )}
              </div>
            }
          </section>

          {/* Completed Trainings Accordion Section */}
          {trainingData.completed.length > 0 &&
          <section className="mb-12" aria-labelledby="completed-training-heading" role="region">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="completed-training" className="border-0">
                  <AccordionTrigger
                  id="completed-training-heading"
                  className="text-left py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:pb-2 [&>svg]:hidden">

                    <div className="flex items-center gap-3 w-full">
                      <ChevronDown className="w-8 h-8 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                      <h2 className="text-h3 text-foreground flex items-center">
                        <CheckCircle className="w-6 h-6 text-success mr-3" aria-hidden="true" />
                        Completed Trainings
                      </h2>
                      <Badge variant="soft-success">{trainingData.completed.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <div
                    className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4"
                    role="grid"
                    aria-label="Completed training videos">

                      {trainingData.completed.map((video, index) =>
                    <TrainingCard key={video.id} video={video} onPlay={handlePlayVideo} priority={false} />
                    )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          }
        </main>
      </div>
    </ErrorBoundary>);

};