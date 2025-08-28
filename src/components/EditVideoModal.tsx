import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, FileVideo, Trash2, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { isYouTubeUrl, isGoogleDriveUrl, getYouTubeVideoId, getGoogleDriveEmbedUrl, getGoogleDriveViewUrl, getYouTubeWatchUrl } from "@/utils/videoUtils";
interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: string;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}
interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoData | null;
  onSave: (videoId: string, updates: {
    title: string;
    description: string;
  }) => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
    }
  }, [video]);
  const handleSave = async () => {
    if (!video) return;
    setLoading(true);
    try {
      await onSave(video.id, {
        title,
        description
      });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating video', error as Error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!video) return;
    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      logger.error('Error deleting video', error as Error);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleClose = () => {
    setTitle('');
    setDescription('');
    onOpenChange(false);
  };
  const hasChanges = video && (title !== (video.title || '') || description !== (video.description || ''));
  if (!video) return null;

  // Check video URL type using utility functions
  const isYouTube = video.video_url && isYouTubeUrl(video.video_url);
  const isGoogleDrive = video.video_url && isGoogleDriveUrl(video.video_url);
  const isFileUpload = video.video_file_name;
  const youtubeVideoId = isYouTube && video.video_url ? getYouTubeVideoId(video.video_url) : null;
  const googleDriveEmbedUrl = isGoogleDrive && video.video_url ? getGoogleDriveEmbedUrl(video.video_url) : null;
  const storageUrl = isFileUpload && video.video_file_name 
    ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}` 
    : null;
  const sourceUrl = video.video_url
    ? (isYouTube ? getYouTubeWatchUrl(video.video_url as string)
      : isGoogleDrive ? getGoogleDriveViewUrl(video.video_url as string)
      : video.video_url)
    : storageUrl;
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Training Video</DialogTitle>
            <DialogDescription>
              Preview and edit details for this training video.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="info" className="w-full">
              

              <TabsContent value="info" className="space-y-6">
                {/* Video Preview Section */}
                <div className="space-y-3">
                  
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-muted/30">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      {isYouTube && youtubeVideoId ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeVideoId}`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full" /> : isGoogleDrive && googleDriveEmbedUrl ? <iframe width="100%" height="100%" src={googleDriveEmbedUrl} title={video.title} frameBorder="0" allowFullScreen className="w-full h-full" /> : video.video_url ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined}>
                          <source src={video.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> : isFileUpload ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined}>
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
                   </div>
                   
                    {/* Video Source */}
                    <div className="text-left">
                      <span className="text-xs text-muted-foreground">
                        Video Source: {isYouTube ? 'YouTube' : 
                         isGoogleDrive ? 'Google Drive' : 
                         isFileUpload ? 'Uploaded File' : 
                         'External'}
                      </span>
                    </div>
                 </div>

                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Video Title</Label>
                  <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title..." />
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter video description..." rows={4} />
                </div>

                {/* Video Info */}
                
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="!flex !flex-row !justify-between !items-center shrink-0 border-t pt-4">
            <Button variant="link" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive p-0 h-auto font-normal">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{video?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};