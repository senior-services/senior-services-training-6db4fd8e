import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { Play, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeService } from "@/services/employeeService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types";
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";

interface VideoPlayerFullscreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string | null;
  onProgressUpdate?: (progress: number) => void;
}

// Fullscreen video modal that fetches video details by ID
export const VideoPlayerFullscreen: React.FC<VideoPlayerFullscreenProps> = ({
  open,
  onOpenChange,
  videoId,
  onProgressUpdate
}) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const ytPlayerRef = useRef<any>(null);
  const ytProgressIntervalRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      if (!open || !videoId) {
        setProgress(0);
        setIsCompleted(false);
        setIsWatching(false);
        return;
      }
      setLoading(true);
      try {
        const v = await EmployeeService.getVideoById(videoId);
        setVideo(v);
        
        // Check if video is already completed by fetching progress
        if (user?.email) {
          try {
            console.log('Fetching progress for video:', videoId, 'user:', user.email);
            const progressData = await EmployeeService.getVideoProgressByEmail(user.email, videoId);
            console.log('Progress data received:', progressData);
            
            if (progressData && progressData.progress_percent >= 100) {
              setProgress(100);
              setIsCompleted(true);
              console.log('Video marked as completed from database');
            } else if (progressData) {
              setProgress(progressData.progress_percent);
              setIsCompleted(false);
              console.log('Video progress loaded:', progressData.progress_percent + '%');
            } else {
              setProgress(0);
              setIsCompleted(false);
              console.log('No existing progress found');
            }
          } catch (error) {
            console.error('Error fetching progress:', error);
            setProgress(0);
            setIsCompleted(false);
          }
        } else {
          setProgress(0);
          setIsCompleted(false);
        }
        setIsWatching(false);
      } catch (e) {
        console.error('Failed to load video for modal:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, videoId, user?.email]);

  // Debounced progress update to database
  const updateProgressToDatabase = useCallback(async (progressPercent: number) => {
    if (!user?.email || !videoId) return;

    try {
      console.log('Updating progress to database:', progressPercent + '%', 'for video:', videoId);
      const completedAt = progressPercent >= 100 ? new Date() : undefined;
      await EmployeeService.updateVideoProgressByEmail(
        user.email,
        videoId,
        progressPercent,
        completedAt
      );
      console.log('Progress updated successfully');

      if (progressPercent >= 100 && !isCompleted) {
        console.log('Video completed! Showing completion state');
        setIsCompleted(true);
        toast({
          title: "Video Completed! 🎉",
          description: "You've successfully completed this training video.",
        });
      }
    } catch (error) {
      console.error('Failed to update video progress:', error);
    }
  }, [user?.email, videoId, isCompleted, toast]);

  // Handle video progress updates for HTML5 videos
  const handleVideoProgress = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!video.duration) return;

    const progressPercent = Math.round((video.currentTime / video.duration) * 100);
    setProgress(progressPercent);
    onProgressUpdate?.(progressPercent);

    // Debounce database updates
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }

    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgressToDatabase(progressPercent);
    }, 2000); // Update database every 2 seconds
  }, [updateProgressToDatabase, onProgressUpdate]);

  // Handle video completion for HTML5 videos
  const handleVideoEnded = useCallback(async () => {
    setProgress(100);
    setIsCompleted(true);
    await updateProgressToDatabase(100);
  }, [updateProgressToDatabase]);

  // Manual completion handler
  const handleMarkComplete = useCallback(async () => {
    if (!video || !user?.email) return;
    
    try {
      setProgress(100);
      setIsCompleted(true);
      await updateProgressToDatabase(100);
      
      toast({
        title: "Training Completed! 🎉",
        description: "You've successfully completed this training video.",
      });
    } catch (error) {
      console.error('Failed to mark video as complete:', error);
      toast({
        title: "Error",
        description: "Failed to save completion status.",
        variant: "destructive",
      });
    }
  }, [video, user?.email, updateProgressToDatabase, toast]);

  // Toggle watching state for progress tracking
  const handleWatchingToggle = useCallback(() => {
    setIsWatching(prev => !prev);
  }, []);

  // Cleanup timeout and intervals on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Clean up intervals when video changes or modal closes
  useEffect(() => {
    if (!open || !videoId) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = undefined;
      }
      setIsWatching(false);
    }
  }, [open, videoId]);

  const content = useMemo(() => {
    if (!video) return null;
    const videoUrl = video.video_url;
    const fileName = video.video_file_name;
    
    if (!videoUrl && !fileName) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Video not available</p>
        </div>
      );
    }
    
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      const id = getYouTubeVideoId(videoUrl);
      if (id) {
        return (
          <iframe 
            src={`https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}`} 
            title={video.title} 
            className="w-full h-full" 
            allowFullScreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            onLoad={() => {
              // Clean up any existing interval
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              
              // Progress tracking using known duration when available
              const duration = (video.duration_seconds && video.duration_seconds > 0) ? video.duration_seconds : 600; // fallback 10 min
              let watchTime = Math.round((progress / 100) * duration);
              
              progressIntervalRef.current = setInterval(() => {
                watchTime += 1;
                const progressPercent = Math.min(100, Math.round((watchTime / duration) * 100));
                setProgress(progressPercent);
                onProgressUpdate?.(progressPercent);
                
                // Auto-complete when reaching 100%
                if (progressPercent >= 100) {
                  setIsCompleted(true);
                  updateProgressToDatabase(100);
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                  }
                } else if (watchTime % 30 === 0) { // Update database every 30 seconds of watch time
                  updateProgressToDatabase(progressPercent);
                }
              }, 1000); // Check every second
            }}
          />
        );
      }
    }
    
    if (videoUrl && isGoogleDriveUrl(videoUrl)) {
      const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
      if (embedUrl) {
        return (
          <iframe 
            src={embedUrl} 
            title={video.title} 
            className="w-full h-full" 
            allowFullScreen 
            onLoad={() => {
              // Clean up any existing interval  
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              
              // Similar tracking for Google Drive videos
              const duration = (video.duration_seconds && video.duration_seconds > 0) ? video.duration_seconds : 600;
              let watchTime = Math.round((progress / 100) * duration);
              
              progressIntervalRef.current = setInterval(() => {
                watchTime += 1;
                const progressPercent = Math.min(100, Math.round((watchTime / duration) * 100));
                setProgress(progressPercent);
                onProgressUpdate?.(progressPercent);
                
                if (progressPercent >= 100) {
                  setIsCompleted(true);
                  updateProgressToDatabase(100);
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                  }
                } else if (watchTime % 30 === 0) {
                  updateProgressToDatabase(progressPercent);
                }
              }, 1000);
            }}
          />
        );
      }
    }
    
    const src = videoUrl || (fileName ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${fileName}` : undefined);
    return (
      <video 
        ref={videoRef}
        className="w-full h-full object-fill" 
        controls 
        preload="metadata"
        onTimeUpdate={handleVideoProgress}
        onEnded={handleVideoEnded}
      >
        {src && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    );
  }, [video, onProgressUpdate, updateProgressToDatabase, progress, handleVideoProgress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-6 overflow-y-auto shadow-2xl">
        <DialogDescription className="sr-only">
          Training video player for {video?.title || 'training content'}
        </DialogDescription>
        <DialogHeader className="pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Play className="w-5 h-5 text-primary" />
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
            <div className="flex items-center gap-3">
              {isCompleted && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
          
          {progress > 0 && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">{progress}% complete</p>
            </div>
          )}
          
          {/* Video Controls */}
          <div className="flex items-center gap-2 mt-3">
            {!isCompleted && (
              <>
                <Button
                  variant={isWatching ? "default" : "outline"}
                  size="sm"
                  onClick={handleWatchingToggle}
                  className="flex items-center gap-2"
                >
                  {isWatching ? "📺 Watching" : "▶️ Start Watching"}
                </Button>
                
                {progress >= 10 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMarkComplete}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </Button>
                )}
              </>
            )}
            
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Training Completed!</span>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSkeleton lines={1} className="w-32 h-32" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">{content}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};