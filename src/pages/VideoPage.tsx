import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Pause, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogScrollArea, DialogTitle } from "@/components/ui/dialog";
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

export const VideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole(user);
  const location = useLocation();

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
      const res = await videoOperations.getById(id);
      if (res.success && res.data) {
        setVideo(res.data);
        
        // Load quiz for this video
        try {
          const quizData = await quizOperations.getByVideoId(res.data.id);
          setQuiz(quizData);
        } catch (error) {
          console.log('No quiz found for this video or error loading quiz:', error);
        }
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
    }
  };

  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const [isCompleted, setIsCompleted] = useState(false);

  // Debounced progress update to database
  const updateProgressToDatabase = async (progressPercent: number, forceComplete = false) => {
    if (!user?.email || !videoId) return;

    try {
      // Only set completedAt if progress is 100% AND (no quiz exists OR forceComplete is true)
      const shouldComplete = progressPercent >= 100 && (!quiz || forceComplete);
      const completedAt = shouldComplete ? new Date() : undefined;
      
      await progressOperations.updateByEmail(
        user.email,
        videoId,
        progressPercent,
        completedAt
      );

      if (shouldComplete && !isCompleted) {
        setIsCompleted(true);
        toast({
          title: "Video Completed! 🎉",
          description: "You've successfully completed this training video.",
        });
      }
    } catch (error) {
      logger.error('Failed to update video progress', error as Error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);

  const handleQuizSubmit = async (responses: QuizSubmissionData[]) => {
    if (!quiz || !user?.email) return;
    
    setIsSubmittingQuiz(true);
    try {
      await quizOperations.submitQuiz(user.email, quiz.id, responses);
      setShowQuiz(false);
      setProgress(100);
      setIsCompleted(true);
      
      // Force completion in database now that quiz is submitted
      await updateProgressToDatabase(100, true);
      
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

  if (loading || authLoading) {
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
          <CardContent className="p-6">
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
                  onProgressUpdate={(newProgress) => {
                    // Cap progress at 99% if quiz exists and hasn't been completed
                    const cappedProgress = quiz && newProgress >= 100 && !isCompleted ? 99 : newProgress;
                    setProgress(cappedProgress);
                    
                    // Show quiz when video completes
                    if (newProgress >= 99 && !isCompleted && quiz && !showQuiz) {
                      setShowQuiz(true);
                    }
                    
                    // Debounce database updates
                    if (progressUpdateTimeoutRef.current) {
                      clearTimeout(progressUpdateTimeoutRef.current);
                    }
                    progressUpdateTimeoutRef.current = setTimeout(() => {
                      updateProgressToDatabase(cappedProgress);
                    }, 1000);
                  }}
                  onVideoEnded={() => {
                    // Handle video completion
                    if (!isCompleted && quiz && !showQuiz) {
                      setShowQuiz(true);
                    } else if (!quiz) {
                      // No quiz, mark as complete immediately
                      setProgress(100);
                      setIsCompleted(true);
                      updateProgressToDatabase(100, true);
                    }
                  }}
                  updateProgressToDatabase={updateProgressToDatabase}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{video.title || 'Untitled Video'}</CardTitle>
                {isCompleted && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              
              {/* Circular Progress Indicator */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Progress</span>
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
                      className={`transition-all duration-300 ${isCompleted ? 'text-green-500' : 'text-primary'}`}
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
                    <span className={`text-sm font-medium ${isCompleted ? 'text-green-500' : 'text-primary'}`}>
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
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Video Progress</span>
                <span>{progress}% Complete</span>
              </div>
              <Progress value={progress} className={`h-2 ${isCompleted ? 'bg-green-100' : ''}`} />
              {isCompleted && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Training completed successfully!</span>
                </div>
              )}
            </div>
            
            {video.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {quiz?.title || 'Quiz'}
            </DialogTitle>
          </DialogHeader>
          <DialogScrollArea>
            <QuizModal
              quiz={quiz}
              onSubmit={handleQuizSubmit}
              onCancel={() => setShowQuiz(false)}
            />
          </DialogScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};