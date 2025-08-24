import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { 
  isYouTubeUrl, 
  isGoogleDriveUrl, 
  getYouTubeVideoId, 
  getGoogleDriveEmbedUrl 
} from "@/utils/videoUtils";

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    type: string;
    assigned_to: number;
    video_url?: string | null;
    video_file_name?: string | null;
    thumbnail_url?: string | null;
  } | null;
}

export const VideoPlayerModal = ({ open, onOpenChange, video }: VideoPlayerModalProps) => {
  console.log('VideoPlayerModal rendered with video:', video);
  
  if (!video) return null;

  const hasVideoSource = video.video_url || video.video_file_name;
  console.log('Video source check:', { 
    video_url: video.video_url, 
    video_file_name: video.video_file_name, 
    hasVideoSource 
  });

  // Check video URL type
  const isYouTube = video.video_url && isYouTubeUrl(video.video_url);
  const isGoogleDrive = video.video_url && isGoogleDriveUrl(video.video_url);

  const youtubeVideoId = isYouTube && video.video_url ? getYouTubeVideoId(video.video_url) : null;
  const googleDriveEmbedUrl = isGoogleDrive && video.video_url ? getGoogleDriveEmbedUrl(video.video_url) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            {video.title}
          </DialogTitle>
          {video.description && (
            <div className="pt-1 pb-2">
              <p className="text-sm text-muted-foreground font-normal">
                {video.description}
              </p>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Player Area */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {isYouTube && youtubeVideoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            ) : isGoogleDrive && googleDriveEmbedUrl ? (
              <iframe
                width="100%"
                height="100%"
                src={googleDriveEmbedUrl}
                title={video.title}
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
              />
            ) : video.video_url ? (
              <video 
                className="w-full h-full"
                controls
                preload="metadata"
                poster={video.thumbnail_url || undefined}
                onLoadStart={() => console.log('Video loading started')}
                onError={(e) => console.error('Video error:', e)}
              >
                <source src={video.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : video.video_file_name ? (
              <video 
                className="w-full h-full"
                controls
                preload="metadata"
                poster={video.thumbnail_url || undefined}
                onLoadStart={() => console.log('Video file loading started')}
                onError={(e) => console.error('Video file error:', e)}
              >
                <source 
                  src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} 
                  type="video/mp4" 
                />
                <source 
                  src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} 
                  type="video/quicktime" 
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Play className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">No video source available</p>
                    <p className="text-sm text-muted-foreground">
                      Add a video URL or upload a file to enable playback
                    </p>
                  </div>
                </div>
              </div>
            )}
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
    </Dialog>
  );
};