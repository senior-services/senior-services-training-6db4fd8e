import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    type: string;
    assigned_to: number;
    has_quiz: boolean;
    video_url?: string;
    video_file_name?: string;
  } | null;
}

export const VideoPlayerModal = ({ open, onOpenChange, video }: VideoPlayerModalProps) => {
  if (!video) return null;

  const hasVideoSource = video.video_url || video.video_file_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            {video.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Player Area */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {hasVideoSource ? (
              <div className="text-center space-y-3">
                <Play className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Video player would be implemented here
                </p>
                {video.video_url && (
                  <p className="text-xs text-muted-foreground">
                    URL: {video.video_url}
                  </p>
                )}
                {video.video_file_name && (
                  <p className="text-xs text-muted-foreground">
                    File: {video.video_file_name}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Play className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-foreground">No video source available</p>
                  <p className="text-sm text-muted-foreground">
                    Add a video URL or upload a file to enable playback
                  </p>
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
              {video.has_quiz && (
                <Badge variant="secondary">
                  Quiz Available
                </Badge>
              )}
              <Badge variant={video.type === 'Required' ? 'default' : 'outline'}>
                {video.type}
              </Badge>
            </div>

            {video.description && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};