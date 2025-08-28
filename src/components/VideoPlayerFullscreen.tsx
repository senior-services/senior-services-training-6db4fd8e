import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { progressOperations, videoOperations } from '@/services/api';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types";
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";
import { logger, performanceTracker } from "@/utils/logger";
import { handleError, createVideoError, withErrorHandler } from "@/utils/errorHandler";

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
  // Component state management
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasEverCompleted, setWasEverCompleted] = useState(false); // Track if video was ever completed
  const [isWatching, setIsWatching] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  
  // Refs for video element and timing management
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const ytPlayerRef = useRef<any>(null);
  const ytProgressIntervalRef = useRef<NodeJS.Timeout>();
  
  // Hooks for authentication and user feedback
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Effect to load video data and existing progress when modal opens
   * Handles video fetching, progress restoration, and error recovery
   * 
   * This effect:
   * 1. Resets state when modal closes or no video is selected
   * 2. Fetches video details using performance tracking
   * 3. Loads existing user progress if authenticated
   * 4. Handles all errors gracefully with user-friendly messages
   * 5. Logs all operations for debugging and monitoring
   */
  useEffect(() => {
    const loadVideoData = async () => {
      if (!open || !videoId) {
        // Reset state when modal is closed or no video selected
        setProgress(0);
        setIsCompleted(false);
        setWasEverCompleted(false);
        setIsWatching(false);
        setShowCompletionOverlay(false);
        return;
      }

      performanceTracker.start('loadVideo');
      setLoading(true);
      
      const loadResult = await withErrorHandler(
        async () => {
          const res = await videoOperations.getById(videoId);
          if (!res.success || !res.data) { throw new Error(res.error || 'Failed to load video'); }
          setVideo(res.data);
          
          logger.videoEvent('video_loaded', videoId, { title: res.data.title });

          // Load existing progress if user is authenticated
          if (user?.email) {
            const progressResult = await progressOperations.getByEmailAndVideo(user.email, videoId);

            if (progressResult.success && progressResult.data) {
              const progressData = progressResult.data;
              const progressPercent = progressData.progress_percent;
              
              setProgress(progressPercent);
              const isVideoCompleted = progressPercent >= 100;
              setIsCompleted(isVideoCompleted);
              // Don't set wasEverCompleted from database - only track current session completion
              
              logger.videoEvent('progress_restored', videoId, {
                progress: progressPercent,
                completed: isVideoCompleted
              });
            } else {
              // No existing progress found or failed to load
              setProgress(0);
              setIsCompleted(false);
              setWasEverCompleted(false);
              setShowCompletionOverlay(false);
              logger.videoEvent('no_previous_progress', videoId);
            }
          } else {
            setProgress(0);
            setIsCompleted(false);
            setWasEverCompleted(false);
            setShowCompletionOverlay(false);
            logger.warn('User not authenticated, cannot load progress', { videoId });
          }
          
          setIsWatching(false);
          return res.data;
        },
        { videoId, userEmail: user?.email },
        'Unable to load video details'
      );

      if (!loadResult.success) {
        toast({
          title: "Video Loading Error",
          description: "Unable to load video details. Please try again.",
          variant: "destructive",
        });
      }

      performanceTracker.end('loadVideo');
      setLoading(false);
    };

    loadVideoData();
  }, [open, videoId, user?.email, toast]);

  /**
   * Debounced progress update to database with error handling and completion detection
   * Updates user's video progress and handles completion state changes
   * 
   * This function:
   * 1. Validates required parameters before proceeding
   * 2. Updates progress in database with completion timestamp if applicable
   * 3. Logs database operations for monitoring
   * 4. Handles completion state changes and user notifications
   * 5. Provides user-friendly error messages on failure
   * 
   * @param {number} progressPercent - Progress percentage (0-100)
   */
  const updateProgressToDatabase = useCallback(async (progressPercent: number) => {
    if (!user?.email || !videoId) {
      logger.warn('Cannot update progress: missing user email or video ID', {
        hasUser: !!user?.email,
        hasVideoId: !!videoId
      });
      return;
    }

    const updateResult = await withErrorHandler(
      async () => {
        const completedAt = progressPercent >= 100 ? new Date() : undefined;
        
        await progressOperations.updateByEmail(
          user.email!,
          videoId,
          progressPercent,
          completedAt
        );

        logger.dbOperation('update', 'video_progress', true, {
          videoId,
          userEmail: user.email,
          progress: progressPercent,
          completed: progressPercent >= 100
        });

        // Handle completion state change
        if (progressPercent >= 100 && !wasEverCompleted) {
          setIsCompleted(true);
          setWasEverCompleted(true);
          setShowCompletionOverlay(true);
          
          logger.videoEvent('video_completed', videoId, {
            userEmail: user.email,
            completionTime: new Date().toISOString()
          });

          // Notify parent about completion
          onProgressUpdate?.(100);

          toast({
            title: "Video Completed! 🎉",
            description: "You've successfully completed this training video."
          });
        }
      },
      { 
        videoId, 
        userEmail: user.email, 
        progress: progressPercent 
      },
      'Failed to save your progress'
    );

    if (!updateResult.success) {
      toast({
        title: "Progress Save Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
    }
  }, [user?.email, videoId, wasEverCompleted, toast, onProgressUpdate]);

  /**
   * Handle video progress updates for HTML5 videos
   * Calculates progress percentage and debounces database updates
   * 
   * @param {React.SyntheticEvent<HTMLVideoElement>} event - Video time update event
   */
  const handleVideoProgress = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!video.duration || video.currentTime < 0) return;
    
    // Use Math.floor for more conservative and accurate progress tracking
    const progressPercent = Math.min(100, Math.max(0, Math.floor((video.currentTime / video.duration) * 100)));
    setProgress(progressPercent);
    onProgressUpdate?.(progressPercent);

    // Debounce database updates with shorter interval for better accuracy
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgressToDatabase(progressPercent);
    }, 1000); // Reduced to 1 second for better responsiveness
  }, [updateProgressToDatabase, onProgressUpdate]);

  /**
   * Handle video completion for HTML5 videos
   * Automatically marks video as complete when it ends
   */
  const handleVideoEnded = useCallback(async () => {
    setProgress(100);
    setShowCompletionOverlay(true);
    // Do not auto-complete; allow user to confirm completion manually
    onProgressUpdate?.(100);
  }, [onProgressUpdate]);

  /**
   * Manual completion handler with proper error handling
   * Allows users to manually mark a video as complete
   * 
   * This is useful for:
   * - Videos that don't provide accurate progress tracking
   * - External embedded videos (YouTube, Google Drive)
   * - User preference to skip to completion
   */
  const handleMarkComplete = useCallback(async () => {
    if (!video || !user?.email) {
      logger.warn('Cannot mark complete: missing video or user', {
        hasVideo: !!video,
        hasUser: !!user?.email
      });
      return;
    }

    const completeResult = await withErrorHandler(
      async () => {
        setProgress(100);
        setIsCompleted(true);
        setWasEverCompleted(true);
        setShowCompletionOverlay(true);
        
        // Ensure database update completes
        await updateProgressToDatabase(100);
        onProgressUpdate?.(100);
        
        // Add small delay before showing success message
        await new Promise(resolve => setTimeout(resolve, 200));
        
        toast({
          title: "Training Completed! 🎉",
          description: "You've successfully completed this training video."
        });
        
        logger.info('Video marked as complete successfully', { 
          videoId: video.id, 
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });
      },
      { videoId: video.id, userEmail: user.email },
      'Failed to mark video as complete'
    );

    if (!completeResult.success) {
      toast({
        title: "Completion Error",
        description: "Failed to mark video as complete. Please try again.",
        variant: "destructive"
      });
    }
  }, [video, user?.email, updateProgressToDatabase, toast]);

  /**
   * Toggles the watching state for progress tracking
   * Used to indicate when user is actively viewing the video
   * Provides visual feedback and logging for user engagement
   */
  const handleWatchingToggle = useCallback(() => {
    setIsWatching(prev => {
      const newState = !prev;
      logger.videoEvent('watching_toggled', videoId || 'unknown', { 
        isWatching: newState 
      });
      return newState;
    });
  }, [videoId]);

  // Ensure YouTube IFrame API is loaded
  const ensureYouTubeAPI = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      const w = window as any;
      if (w.YT && w.YT.Player) return resolve();
      if (w._ytApiReady) return (w._ytApiReady as Promise<void>).then(() => resolve());
      w._ytApiReady = new Promise<void>((res) => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        w.onYouTubeIframeAPIReady = () => { res(); resolve(); };
      });
    });
  }, []);

  /**
   * Cleanup effect for timeouts and intervals
   * Prevents memory leaks when component unmounts
   * Essential for proper resource management
   */
  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (ytProgressIntervalRef.current) {
        clearInterval(ytProgressIntervalRef.current);
      }
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {}
      logger.debug('VideoPlayerFullscreen cleanup completed');
    };
  }, []);

  /**
   * Effect to clean up intervals when video changes or modal closes
   * Ensures no orphaned intervals continue running
   * Prevents memory leaks and unnecessary API calls
   */
  useEffect(() => {
    if (!open || !videoId) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = undefined;
      }
      setIsWatching(false);
      logger.debug('Video intervals cleared due to modal close or video change');
    }
  }, [open, videoId]);

  /**
   * Memoized video content renderer
   * Handles different video sources and provides appropriate player components
   * Includes progress tracking for embedded videos using time-based estimation
   */
  const content = useMemo(() => {
    if (!video) return null;
    
    const videoUrl = video.video_url;
    const fileName = video.video_file_name;
    
    // No video source available
    if (!videoUrl && !fileName) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Video not available</p>
        </div>
      );
    }

    // YouTube video handling
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      const id = getYouTubeVideoId(videoUrl);
      if (id) {
        return (
          <iframe 
            id={`yt-player-${id}`}
            src={`https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}`}
            title={video.title}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => {
              // Initialize YouTube IFrame API player and progress tracking
              ensureYouTubeAPI().then(() => {
                if (ytProgressIntervalRef.current) {
                  clearInterval(ytProgressIntervalRef.current);
                }
                try { ytPlayerRef.current?.destroy?.(); } catch {}
                // Create player bound to this iframe
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const YTGlobal: any = (window as any).YT;
                ytPlayerRef.current = new YTGlobal.Player(`yt-player-${id}`, {
                  events: {
                    onReady: (e: any) => {
                      ytProgressIntervalRef.current = setInterval(() => {
                        const current = e.target.getCurrentTime ? e.target.getCurrentTime() : 0;
                        const duration = e.target.getDuration ? e.target.getDuration() : (video.duration_seconds || 0);
                        if (duration > 0) {
                          const progressPercent = Math.min(100, Math.floor((current / duration) * 100));
                          setProgress(progressPercent);
                          onProgressUpdate?.(progressPercent);
                          if (progressPercent >= 100) {
                            clearInterval(ytProgressIntervalRef.current!);
                            setShowCompletionOverlay(true);
                            updateProgressToDatabase(100);
                          } else if (Math.floor(current) % 15 === 0) {
                            updateProgressToDatabase(progressPercent);
                          }
                        }
                      }, 1000);
                    },
                    onStateChange: (e: any) => {
                      const state = YTGlobal.PlayerState;
                      if (e.data === state.ENDED) {
                        setProgress(100);
                        setShowCompletionOverlay(true);
                        onProgressUpdate?.(100);
                        updateProgressToDatabase(100);
                        if (ytProgressIntervalRef.current) clearInterval(ytProgressIntervalRef.current);
                      } else if (e.data === state.PAUSED) {
                        updateProgressToDatabase(progress);
                      }
                    }
                  }
                });
              });
            }}
          />
        );
      }
    }

    // Google Drive video handling
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

              // Enhanced tracking for Google Drive videos
              const estimatedDuration = video.duration_seconds && video.duration_seconds > 0 ? video.duration_seconds : 1800; // 30 min fallback
              let watchTime = Math.round((progress / 100) * estimatedDuration);
              let consecutiveProgressChecks = 0;
              let lastProgressPercent = progress;
              
              progressIntervalRef.current = setInterval(() => {
                watchTime += 1;
                const progressPercent = Math.min(100, Math.max(0, Math.floor((watchTime / estimatedDuration) * 100)));
                
                // Enhanced completion detection for Google Drive videos
                if (progressPercent === lastProgressPercent) {
                  consecutiveProgressChecks++;
                } else {
                  consecutiveProgressChecks = 0;
                  lastProgressPercent = progressPercent;
                }
                
                // If progress hasn't changed for 30+ seconds and we're past 90%, likely completed
                const likelyCompleted = consecutiveProgressChecks > 30 && progressPercent >= 90;
                const actuallyCompleted = progressPercent >= 100;
                
                if (likelyCompleted || actuallyCompleted) {
                  setProgress(100);
                  setShowCompletionOverlay(true);
                  onProgressUpdate?.(100);
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                  }
                } else {
                  setProgress(progressPercent);
                  onProgressUpdate?.(progressPercent);
                  
                  if (watchTime % 15 === 0) {
                    // Update database every 15 seconds for better accuracy
                    updateProgressToDatabase(progressPercent);
                  }
                }
              }, 1000);
            }}
          />
        );
      }
    }

    // Direct video file handling (HTML5 video element)
    const src = videoUrl || (fileName ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${fileName}` : undefined);
    
    return (
      <video 
        ref={videoRef}
        className="w-full h-full object-fill"
        controls
        preload="metadata"
        onTimeUpdate={handleVideoProgress}
        onEnded={handleVideoEnded}
        tabIndex={-1}
        onLoadedMetadata={() => {
          // Focus on the video container when video is ready
          const container = document.querySelector('[data-video-container]') as HTMLElement;
          if (container && open) {
            container.focus();
          }
        }}
      >
        {src && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    );
  }, [video, onProgressUpdate, updateProgressToDatabase, progress, handleVideoProgress, handleVideoEnded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[90vh] p-6 overflow-y-auto shadow-2xl"
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
        <DialogDescription id="video-description" className="sr-only">
          Training video player for {video?.title || 'training content'}. 
          Use the controls below to watch the video and track your progress.
          Press Escape key to close this dialog. Press spacebar to play or pause the video.
        </DialogDescription>
        
        <DialogHeader className="pb-4 border-b flex-shrink-0">
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
          
           {/* Video Controls */}
           <div className="flex items-center gap-2 mt-3" role="toolbar" aria-label="Video controls and completion options">
             {(() => {
               const url = video?.video_url || '';
               const isEmbedded = !!url && (isYouTubeUrl(url) || isGoogleDriveUrl(url));
               const hasUnknownDuration = !video?.duration_seconds || video.duration_seconds <= 0;
               const useLowThreshold = isEmbedded || hasUnknownDuration;
               const threshold = useLowThreshold ? 98 : 98;
               const shouldShowButton = !isCompleted && progress >= threshold;
               
                // Only log when video is actually loaded and we have meaningful data
                if (video?.title && progress > 0) {
                   logger.debug('Mark Complete Button:', { 
                     hasVideo: !!video,
                     hasUser: !!user?.email,
                     videoId: video?.id,
                     userEmail: user?.email,
                     video: video.title,
                     progress,
                     shouldShow: shouldShowButton
                   });
                }
               
               return shouldShowButton ? (
                 <Button 
                   variant="default" 
                   size="sm" 
                   onClick={handleMarkComplete}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       handleMarkComplete();
                     }
                   }}
                   className="flex items-center gap-2 bg-success hover:bg-success/90"
                   aria-label="Mark training video as complete"
                 >
                   <CheckCircle className="w-4 h-4" aria-hidden="true" />
                   Mark Complete
                 </Button>
               ) : null;
             })()}
           </div>
        </DialogHeader>
        
        <div 
          className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex-shrink-0 relative"
          data-video-container
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
              e.preventDefault();
              // Handle spacebar for different video types
              if (videoRef.current) {
                // Direct video element
                if (videoRef.current.paused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              } else if (ytPlayerRef.current?.playVideo) {
                // YouTube video
                const playerState = (window as any).YT?.PlayerState;
                if (playerState && ytPlayerRef.current.getPlayerState) {
                  const state = ytPlayerRef.current.getPlayerState();
                  if (state === playerState.PLAYING) {
                    ytPlayerRef.current.pauseVideo();
                  } else {
                    ytPlayerRef.current.playVideo();
                  }
                }
              }
              // Note: Google Drive videos in iframes can't be controlled externally
            }
          }}
          aria-label="Video player. Press spacebar to play or pause."
          role="application"
        >
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSkeleton lines={1} className="w-32 h-32" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {content}
            </div>
          )}
          
          {/* Completion Overlay */}
          {showCompletionOverlay && progress >= 100 && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
              <div className="bg-card rounded-xl p-8 max-w-md mx-4 text-center shadow-xl border animate-scale-in">
                <div className="mb-4">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Training Completed! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    You've successfully completed "{video?.title}"
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setShowCompletionOverlay(false);
                    onOpenChange(false);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};