import React, { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { Play } from "lucide-react";
import { EmployeeService } from "@/services/employeeService";
import type { Video } from "@/types";
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";
interface VideoPlayerFullscreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string | null;
}

// Fullscreen video modal that fetches video details by ID
export const VideoPlayerFullscreen: React.FC<VideoPlayerFullscreenProps> = ({
  open,
  onOpenChange,
  videoId
}) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      if (!open || !videoId) return;
      setLoading(true);
      try {
        const v = await EmployeeService.getVideoById(videoId);
        setVideo(v);
      } catch (e) {
        console.error('Failed to load video for modal:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, videoId]);
  const content = useMemo(() => {
    if (!video) return null;
    const videoUrl = video.video_url;
    const fileName = video.video_file_name;
    if (!videoUrl && !fileName) {
      return <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Video not available</p>
        </div>;
    }
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      const id = getYouTubeVideoId(videoUrl);
      if (id) {
        return <iframe src={`https://www.youtube.com/embed/${id}`} title={video.title} className="w-full h-full max-w-full max-h-full object-contain" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />;
      }
    }
    if (videoUrl && isGoogleDriveUrl(videoUrl)) {
      const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
      if (embedUrl) {
        return <iframe src={embedUrl} title={video.title} className="w-full h-full max-w-full max-h-full object-contain" allowFullScreen />;
      }
    }
    const src = videoUrl || (fileName ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${fileName}` : undefined);
    return <video className="w-full h-full max-w-full max-h-full object-contain" controls preload="metadata">
        {src && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>;
  }, [video]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[100vw] h-[100vh] p-0 sm:rounded-none overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            {video?.title || 'Training Video'}
          </DialogTitle>
          
        </DialogHeader>
        <div className="w-full h-[calc(100vh-4.5rem)] bg-black flex items-center justify-center">
          {loading ? <div className="w-full h-full flex items-center justify-center">
              <LoadingSkeleton lines={1} className="w-32 h-32" />
            </div> : <div className="w-full h-full flex items-center justify-center">{content}</div>}
        </div>
      </DialogContent>
    </Dialog>;
};