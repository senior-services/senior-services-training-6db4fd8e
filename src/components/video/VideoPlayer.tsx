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
}

export function VideoPlayer({ 
  video, 
  loading, 
  progress, 
  onProgressUpdate, 
  onVideoEnded
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const ytPlayerRef = useRef<any>(null);
  const ytProgressIntervalRef = useRef<NodeJS.Timeout>();
  const completionTriggeredRef = useRef<boolean>(false);

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
    const video = event.currentTarget;
    if (!video.duration || video.currentTime < 0) return;
    
    const progressPercent = Math.min(100, Math.max(0, Math.floor((video.currentTime / video.duration) * 100)));
    onProgressUpdate(progressPercent);
  }, [onProgressUpdate]);

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
          // Use youtube-nocookie.com for GDPR compliance - delays cookie setting until video plays
          <iframe 
            id={`yt-player-${id}`}
            src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&origin=${window.location.origin}&loop=0&rel=0`}
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
                      ytProgressIntervalRef.current = setInterval(() => {
                        const current = e.target.getCurrentTime ? e.target.getCurrentTime() : 0;
                        const duration = e.target.getDuration ? e.target.getDuration() : (video.duration_seconds || 0);
                        if (duration > 0) {
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
                        // onVideoEnded already called by progress tracker at 100%
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
        onEnded={handleVideoEnded}
      >
        {src && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    );
  }, [video, onProgressUpdate, progress, handleVideoProgress, handleVideoEnded, onVideoEnded, ensureYouTubeAPI]);

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