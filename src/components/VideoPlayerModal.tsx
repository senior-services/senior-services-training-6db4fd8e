import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { logger } from "@/utils/logger";
import { isYouTubeUrl, isGoogleDriveUrl, getYouTubeVideoId, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";
interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    assigned_to: number;
    video_url?: string | null;
    video_file_name?: string | null;
    thumbnail_url?: string | null;
  } | null;
}
export const VideoPlayerModal = ({
  open,
  onOpenChange,
  video
}: VideoPlayerModalProps) => {
  // Only log when actually opening with video data
  if (open && video) {
    logger.info('VideoPlayerModal opened', {
      videoTitle: video.title
    });
  }

  // Handle modal close and cleanup
  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };
  if (!video) {
    return <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No video selected</p>
          </div>
        </DialogContent>
      </Dialog>;
  }
  const hasVideoSource = video.video_url || video.video_file_name;
  logger.info('Video source determined', {
    videoId: video.id,
    hasUrl: !!video.video_url,
    hasFile: !!video.video_file_name,
    hasVideoSource
  });

  // Check video URL type
  const isYouTube = video.video_url && isYouTubeUrl(video.video_url);
  const isGoogleDrive = video.video_url && isGoogleDriveUrl(video.video_url);
  const youtubeVideoId = isYouTube && video.video_url ? getYouTubeVideoId(video.video_url) : null;
  const googleDriveEmbedUrl = isGoogleDrive && video.video_url ? getGoogleDriveEmbedUrl(video.video_url) : null;
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            {video.title}
          </DialogTitle>
          {video.description && video.description.trim() && <div className="">
              <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                {video.description}
              </p>
            </div>}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Video Player Area */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {isYouTube && youtubeVideoId ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeVideoId}`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full" /> : isGoogleDrive && googleDriveEmbedUrl ? <iframe width="100%" height="100%" src={googleDriveEmbedUrl} title={video.title} frameBorder="0" allowFullScreen className="w-full h-full" /> : video.video_url ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined} onLoadStart={() => logger.info('Video loading started', {
            videoId: video.id
          })} onError={e => logger.error('Video playback error', new Error(`Video error: ${e.type}`), {
            videoId: video.id
          })}>
                <source src={video.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video> : video.video_file_name ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined} onLoadStart={() => logger.info('Video file loading started', {
            videoId: video.id
          })} onError={e => logger.error('Video file playback error', new Error(`Video file error: ${e.type}`), {
            videoId: video.id
          })}>
                <source src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} type="video/mp4" />
                <source src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} type="video/quicktime" />
                Your browser does not support the video tag.
              </video> : <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Play className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">No video source available</p>
                    <p className="text-sm text-muted-foreground">
                      Add a video URL or upload a file to enable playback
                    </p>
                  </div>
                </div>
              </div>}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Assigned to {video.assigned_to} employees</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};