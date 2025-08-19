import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Play, FileVideo, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: string;
  has_quiz: boolean;
  assigned_to: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoData | null;
  onSave: (videoId: string, updates: { title: string; description: string }) => Promise<void>;
  onDelete: (videoId: string) => Promise<void>;
}

export const EditVideoModal = ({
  open,
  onOpenChange,
  video,
  onSave,
  onDelete
}: EditVideoModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
    }
  }, [video]);

  const handleSave = async () => {
    if (!video) return;
    
    setIsSaving(true);
    try {
      await onSave(video.id, { title, description });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    
    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
    }
    onOpenChange(false);
  };

  // Check if there are unsaved changes
  const hasChanges = video && (
    title !== (video.title || '') || 
    description !== (video.description || '')
  );

  if (!video) return null;

  // Determine video source and type
  const isYouTubeUrl = video.video_url && (
    video.video_url.includes('youtube.com/watch') || 
    video.video_url.includes('youtu.be/')
  );
  const isDriveUrl = video.video_url && video.video_url.includes('drive.google.com');
  const isFileUpload = video.video_file_name;

  // Extract YouTube video ID for embedding
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    console.log('YouTube URL parsing:', { url, match, videoId: match?.[1] });
    return match ? match[1] : null;
  };

  const youtubeVideoId = isYouTubeUrl && video.video_url ? getYouTubeVideoId(video.video_url) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Training Video</DialogTitle>
            <DialogDescription>
              Preview, edit details, or manage this training video.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 p-1">
            {/* Video Preview Section */}
            <div className="space-y-3">
              <Label>Video Preview</Label>
              <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                {isYouTubeUrl && youtubeVideoId ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                  </div>
                ) : video.video_url && !isYouTubeUrl && !isDriveUrl ? (
                  <div className="relative aspect-video bg-black">
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    >
                      <source src={video.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : isYouTubeUrl ? (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                    <div className="text-center space-y-2">
                      <Play className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">YouTube Video</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {video.video_url}
                      </p>
                      {video.video_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(video.video_url!, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Open Video
                        </Button>
                      )}
                    </div>
                  </div>
                ) : isDriveUrl ? (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                    <div className="text-center space-y-2">
                      <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Google Drive Video</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {video.video_url}
                      </p>
                      {video.video_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(video.video_url!, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Open Video
                        </Button>
                      )}
                    </div>
                  </div>
                ) : isFileUpload ? (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                    <div className="text-center space-y-2">
                      <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Uploaded Video File</p>
                      <p className="text-xs text-muted-foreground">
                        {video.video_file_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                    <div className="text-center space-y-2">
                      <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Video source not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Video Title</Label>
              <Input 
                id="edit-title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title..."
              />
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description..."
                rows={4}
              />
            </div>

            {/* Video Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Type</p>
                <p className="text-foreground">{video.type}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Has Quiz</p>
                <p className="text-foreground">{video.has_quiz ? 'Yes' : 'No'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Assigned To</p>
                <p className="text-foreground">{video.assigned_to} employees</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-foreground">{video.completion_rate}%</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="link" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive p-0 h-auto font-normal"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{video?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};