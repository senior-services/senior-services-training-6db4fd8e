import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Pause, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, FullscreenDialogContent, DialogScrollArea } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { videoOperations, progressOperations } from '@/services/api';
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import type { Video } from "@/types";
import { logger } from '@/utils/logger';
import { quizOperations } from "@/services/quizService";
import { QuizModal } from "@/components/quiz/QuizModal";
import { QuizWithQuestions, QuizSubmissionData } from "@/types/quiz";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { sanitizeVideoUrl } from "@/utils/security";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { CompletionOverlay } from "@/components/video/CompletionOverlay";
import { isLegacyExempt } from "@/utils/quizHelpers";

export const VideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole(user);
  const location = useLocation();

  // Use video progress hook
  const {
    progress,
    isCompleted,
    updateProgress,
    markComplete,
    loadExistingProgress
  } = useVideoProgress({
    videoId: videoId || null,
    userEmail: user?.email || null,
    hasQuiz: !!quiz
  });

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    logger.info('VideoPage route accessed', { videoId });
  }, [location, videoId]);

  const loadVideo = async (id: string) => {
    try {
      setLoading(true);
      setProgressLoading(true);
      
      const res = await videoOperations.getById(id);
      if (res.success && res.data) {
        setVideo(res.data);
        
        // Load quiz and existing progress
        let quizData: QuizWithQuestions | null = null;
        try {
          quizData = await quizOperations.getByVideoId(res.data.id);
        } catch (error) {
          console.log('No quiz found for this video or error loading quiz:', error);
        }

        let completedAt: string | null = null;
        if (user?.email) {
          try {
            const progressResult = await loadExistingProgress();
            completedAt = progressResult?.completedAt || null;
          } catch (error) {
            logger.error('Failed to load existing progress', error as Error);
            toast({
              title: "Warning",
              description: "Could not load your previous progress",
              variant: "default",
            });
          }
        }

        // Legacy exemption: hide quiz if employee completed before quiz was created
        if (quizData && isLegacyExempt(completedAt, quizData.created_at)) {
          logger.info('Employee is legacy-exempt from quiz', {
            videoId: res.data.id,
            completedAt,
            quizCreatedAt: quizData.created_at,
          });
          quizData = null;
        }

        setQuiz(quizData);
      } else {
        throw new Error(res.error || 'Failed to load video');
      }
    } catch (error) {
      logger.error('Error loading video', error as Error);
      toast({
        title: "Error",
        description: "Failed to load video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgressLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setShowCompletionOverlay(false);
    setShowQuiz(true);
  };

  const handleCompleteTraining = async () => {
    await markComplete();
    setShowCompletionOverlay(false);
    toast({
      title: "Training Completed! 🎉",
      description: "You've successfully completed this training.",
    });
  };

  const handleQuizSubmit = async (responses: QuizSubmissionData[]) => {
    if (!quiz || !user?.email) return;
    
    setIsSubmittingQuiz(true);
    try {
      await quizOperations.submitQuiz(user.email, quiz.id, responses);
      setShowQuiz(false);
      await markComplete();
      
      toast({
        title: "Quiz completed!",
        description: "Your training has been marked as complete.",
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Validate video URL for security
  const validatedVideo = useMemo(() => {
    if (!video) return null;
    
    // Validate video URL if present
    if (video.video_url) {
      const sanitizedUrl = sanitizeVideoUrl(video.video_url);
      if (!sanitizedUrl) {
        logger.warn('Invalid video URL detected', { videoId: video.id });
        return null;
      }
      return { ...video, video_url: sanitizedUrl };
    }
    
    return video;
  }, [video]);

  // Redirect if not authenticated (but wait for auth loading to complete)
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading || authLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <LoadingSkeleton lines={1} className="h-8 w-48 mb-4" />
          </div>
          <LoadingSkeleton lines={1} className="aspect-video mb-6" />
          <LoadingSkeleton lines={1} className="h-8 w-64 mb-4" />
          <LoadingSkeleton lines={3} className="h-20" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Video not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Return to Dashboard Link */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>

        {/* Video Player */}
        <Card className="mb-6">
          <CardContent className="relative">
            {!validatedVideo ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Video URL validation failed</p>
              </div>
            ) : (
              <div className="aspect-video">
                <VideoPlayer
                  video={validatedVideo}
                  loading={false}
                  progress={progress}
                  onProgressUpdate={updateProgress}
                  onVideoEnded={() => {
                    updateProgress(100);
                    setShowCompletionOverlay(true);
                  }}
                />
                
                {/* Completion Overlay */}
                {showCompletionOverlay && (
                  <CompletionOverlay
                    video={validatedVideo}
                    quiz={quiz}
                    onStartQuiz={handleStartQuiz}
                    onCompleteTraining={handleCompleteTraining}
                    onClose={quiz ? () => setShowCompletionOverlay(false) : undefined}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-h2">{video.title || 'Untitled Video'}</CardTitle>
                {isCompleted && (
                  <Badge variant="success">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              
              {/* Circular Progress Indicator */}
              <div className="flex items-center space-x-3">
                <span className="text-small text-muted-foreground">Progress</span>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      d="M18 2.0845
                        A 15.9155 15.9155 0 0 1 18 33.9155
                        A 15.9155 15.9155 0 0 1 18 2.0845"
                    />
                    <path
                      className={`transition-all duration-300 ${isCompleted ? 'text-success' : 'text-primary'}`}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progress}, 100`}
                      strokeLinecap="round"
                      fill="transparent"
                      d="M18 2.0845
                        A 15.9155 15.9155 0 0 1 18 33.9155
                        A 15.9155 15.9155 0 0 1 18 2.0845"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-small font-medium ${isCompleted ? 'text-success' : 'text-primary'}`}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Linear Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-small text-muted-foreground mb-2">
                <span>Video Progress</span>
                <span>{progress}% Complete</span>
              </div>
              <Progress value={progress} className={`h-2 ${isCompleted ? 'bg-success/10' : ''}`} />
              {isCompleted && (
                <div className="flex items-center gap-2 mt-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-small font-medium">Training completed successfully!</span>
                </div>
              )}
            </div>
            
            {video.description && (
              <div className="space-y-4">
                <h3 className="text-h4">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <FullscreenDialogContent>
          <DialogScrollArea>
            <QuizModal
              quiz={quiz}
              onSubmit={handleQuizSubmit}
              onCancel={() => setShowQuiz(false)}
            />
          </DialogScrollArea>
        </FullscreenDialogContent>
      </Dialog>
    </div>
  );
};