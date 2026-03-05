import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";
import { logger } from "@/utils/logger";
import { sanitizeVideoUrl } from "@/utils/security";
import type { Video } from "@/types";

interface VideoPlayerProps {
  video: Video | null;
  loading: boolean;
  progress: number;
  onProgressUpdate: (progress: number) => void;
  onVideoEnded: () => void;
  furthestWatchedSeconds?: number;
  onFurthestUpdate?: (seconds: number) => void;
  initialSeekSeconds?: number;
  onLastPositionUpdate?: (seconds: number) => void;
}

export function VideoPlayer({ 
  video, 
  loading, 
  progress, 
  onProgressUpdate, 
  onVideoEnded,
  furthestWatchedSeconds = 0,
  onFurthestUpdate,
  initialSeekSeconds = 0,
  onLastPositionUpdate
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const ytPlayerRef = useRef<any>(null);
  const ytProgressIntervalRef = useRef<NodeJS.Timeout>();
  const completionTriggeredRef = useRef<boolean>(false);
  const furthestRef = useRef<number>(furthestWatchedSeconds);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const html5ReadyRef = useRef<boolean>(false);


  // Keep furthestRef in sync with prop
  useEffect(() => {
    furthestRef.current = Math.max(furthestRef.current, furthestWatchedSeconds);
  }, [furthestWatchedSeconds]);

  // Late-seek: if initialSeekSeconds arrives after player is already ready
  useEffect(() => {
    if (initialSeekSeconds > 0) {
      try {
        if (ytPlayerReadyRef.current && ytPlayerRef.current?.seekTo && ytPlayerRef.current?.getIframe?.()) {
          ytPlayerRef.current.seekTo(initialSeekSeconds, true);
        } else if (html5ReadyRef.current && videoRef.current) {
          videoRef.current.currentTime = initialSeekSeconds;
        }
      } catch (e) {
        logger.warn('Late-seek skipped — YT player not fully ready', e);
      }
    }
  }, [initialSeekSeconds]);

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

  // Handle video progress updates for HTML5 videos
  const handleVideoProgress = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = event.currentTarget;
    if (!videoEl.duration || videoEl.currentTime < 0) return;
    
    // Update furthest watched
    if (videoEl.currentTime <= furthestRef.current + (videoEl.playbackRate * 2)) {
      const newFurthest = Math.max(furthestRef.current, videoEl.currentTime);
      if (newFurthest > furthestRef.current) {
        furthestRef.current = newFurthest;
        onFurthestUpdate?.(newFurthest);
      }
    }
    
    // Report current position for resume
    onLastPositionUpdate?.(videoEl.currentTime);
    
    const progressPercent = Math.min(100, Math.max(0, Math.floor((videoEl.currentTime / videoEl.duration) * 100)));
    onProgressUpdate(progressPercent);
  }, [onProgressUpdate, onFurthestUpdate, onLastPositionUpdate]);

  // HTML5 seeking enforcement
  const handleSeeking = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = event.currentTarget;
    if (videoEl.currentTime > furthestRef.current + (videoEl.playbackRate * 2)) {
      videoEl.currentTime = furthestRef.current;
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    onProgressUpdate(100);
    onVideoEnded();
  }, [onProgressUpdate, onVideoEnded]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (ytProgressIntervalRef.current) {
        clearInterval(ytProgressIntervalRef.current);
      }
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {}
      logger.debug('VideoPlayer cleanup completed');
    };
  }, []);

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
            src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}&loop=0&rel=0&modestbranding=1`}
            title={video.title}
            aria-label={`YouTube video player for ${video.title}`}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => {
              ensureYouTubeAPI().then(() => {
                if (ytProgressIntervalRef.current) {
                  clearInterval(ytProgressIntervalRef.current);
                }
                try { ytPlayerRef.current?.destroy?.(); } catch {}
                
                const YTGlobal: any = (window as any).YT;
                ytPlayerRef.current = new YTGlobal.Player(`yt-player-${id}`, {
                  events: {
                    onReady: (e: any) => {
                      ytPlayerReadyRef.current = true;
                      if (initialSeekSeconds > 0) {
                        e.target.seekTo(initialSeekSeconds, true);
                      }
                      
                      ytProgressIntervalRef.current = setInterval(() => {
                        const current = e.target.getCurrentTime ? e.target.getCurrentTime() : 0;
                        const duration = e.target.getDuration ? e.target.getDuration() : (video.duration_seconds || 0);
                        
                        if (duration > 0) {
                          // Anti-skip enforcement: if user jumped beyond furthest + buffer, snap back
                          const playbackRate = e.target.getPlaybackRate ? e.target.getPlaybackRate() : 1;
                          if (current > furthestRef.current + (playbackRate * 2)) {
                            e.target.seekTo(furthestRef.current, true);
                            return;
                          }
                          
                          // Update furthest watched point
                          if (current > furthestRef.current) {
                            furthestRef.current = Math.floor(current);
                            onFurthestUpdate?.(furthestRef.current);
                          }
                          
                          // Report current position for resume
                          onLastPositionUpdate?.(current);
                          
                          const progressPercent = Math.min(100, Math.floor((current / duration) * 100));
                          onProgressUpdate(progressPercent);
                          
                          // Trigger completion once when reaching 100%
                          if (progressPercent >= 100 && !completionTriggeredRef.current) {
                            completionTriggeredRef.current = true;
                            clearInterval(ytProgressIntervalRef.current!);
                            onVideoEnded();
                          }
                        }
                      }, 1000);
                    },
                    onStateChange: (e: any) => {
                      const state = YTGlobal.PlayerState;
                      if (e.data === state.ENDED) {
                        onProgressUpdate(100);
                        if (ytProgressIntervalRef.current) clearInterval(ytProgressIntervalRef.current);
                        if (!completionTriggeredRef.current) {
                          completionTriggeredRef.current = true;
                          onVideoEnded();
                        }
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

    // Google Drive video handling (no seek restriction — opaque iframe)
    if (videoUrl && isGoogleDriveUrl(videoUrl)) {
      const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
      if (embedUrl) {
        return (
          <iframe 
            src={embedUrl}
            title={video.title}
            aria-label={`Google Drive video player for ${video.title}`}
            className="w-full h-full"
            allowFullScreen
            onLoad={() => {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }

              const estimatedDuration = video.duration_seconds && video.duration_seconds > 0 ? video.duration_seconds : 1800;
              let watchTime = Math.round((progress / 100) * estimatedDuration);
              let consecutiveProgressChecks = 0;
              let lastProgressPercent = progress;
              
              progressIntervalRef.current = setInterval(() => {
                watchTime += 1;
                const progressPercent = Math.min(100, Math.max(0, Math.floor((watchTime / estimatedDuration) * 100)));
                
                if (progressPercent === lastProgressPercent) {
                  consecutiveProgressChecks++;
                } else {
                  consecutiveProgressChecks = 0;
                  lastProgressPercent = progressPercent;
                }
                
                const likelyCompleted = consecutiveProgressChecks > 30 && progressPercent >= 90;
                const actuallyCompleted = progressPercent >= 100;
                 
                if (likelyCompleted || actuallyCompleted) {
                  onProgressUpdate(100);
                  onVideoEnded();
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                  }
                } else {
                  onProgressUpdate(progressPercent);
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
        aria-label={`Video player for ${video.title}`}
        onTimeUpdate={handleVideoProgress}
        onSeeking={handleSeeking}
        onEnded={handleVideoEnded}
        onLoadedMetadata={(e) => {
          html5ReadyRef.current = true;
          if (initialSeekSeconds > 0) {
            e.currentTarget.currentTime = initialSeekSeconds;
          }
        }}
      >
        {src && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    );
  }, [video, onProgressUpdate, progress, handleVideoProgress, handleSeeking, handleVideoEnded, onVideoEnded, ensureYouTubeAPI, onFurthestUpdate, onLastPositionUpdate, initialSeekSeconds]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSkeleton lines={1} className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {content}
    </div>
  );
}
