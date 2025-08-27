/**
 * Video Management Component
 * Handles video library operations including CRUD functionality
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Play, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Video data interface for type safety and documentation
 */
export interface VideoData {
  /** Unique video identifier */
  id: string;
  /** Video title */
  title: string;
  /** Optional video description */
  description: string | null;
  /** URL for streaming videos (YouTube, etc.) */
  video_url: string | null;
  /** Filename for uploaded video files */
  video_file_name: string | null;
  /** Optional thumbnail image URL */
  thumbnail_url?: string | null;
  /** Video type classification */
  type: string;
  /** Number of employees assigned to this video */
  assigned_to: number;
  /** Completion rate percentage */
  completion_rate: number;
  /** Video creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

interface VideoManagementProps {
  /** Array of video data to display */
  videos: VideoData[];
  /** Loading state indicator */
  loading: boolean;
  /** Callback when add video button is clicked */
  onAddVideo: () => void;
  /** Callback when edit video is requested */
  onEditVideo: (video: VideoData) => void;
  /** Callback when delete video is requested */
  onDeleteVideo: (videoId: string) => void;
  /** Callback when video thumbnail is clicked */
  onVideoThumbnailClick: (video: VideoData) => void;
  /** Delete confirmation state */
  deleteConfirmVideo: VideoData | null;
  /** Set delete confirmation video */
  setDeleteConfirmVideo: (video: VideoData | null) => void;
  /** Delete in progress state */
  isDeleting: boolean;
}

/**
 * Generates a consistent color for video thumbnails based on title
 * Provides visual consistency and accessibility for videos without thumbnails
 */
const generateThumbnailColor = (title: string): string => {
  const colors = [
    'bg-primary/10 text-primary', 
    'bg-secondary/10 text-secondary-foreground', 
    'bg-accent/10 text-accent-foreground',
    'bg-muted/10 text-muted-foreground'
  ];
  
  // Create hash from title for consistent color selection
  const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

/**
 * VideoManagement component provides comprehensive video library management
 * including viewing, adding, editing, and deleting training videos
 */
export const VideoManagement = ({
  videos,
  loading,
  onAddVideo,
  onEditVideo,
  onDeleteVideo,
  onVideoThumbnailClick,
  deleteConfirmVideo,
  setDeleteConfirmVideo,
  isDeleting
}: VideoManagementProps) => {
  const handleDeleteConfirm = () => {
    if (deleteConfirmVideo) {
      onDeleteVideo(deleteConfirmVideo.id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Library</CardTitle>
          <CardDescription>Loading training videos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" aria-hidden="true" />
                Video Library
              </CardTitle>
              <CardDescription>
                Manage training videos and track employee progress
              </CardDescription>
            </div>
            <Button 
              onClick={onAddVideo}
              className="bg-primary hover:bg-primary/90"
              aria-label="Add new training video"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first training video
              </p>
              <Button 
                onClick={onAddVideo}
                variant="outline"
                aria-label="Add your first training video"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add First Video
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead>Title & Description</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        Assigned
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Completion</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        Created
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id} className="hover:bg-muted/50">
                      <TableCell>
                        <button
                          onClick={() => onVideoThumbnailClick(video)}
                          className={`w-12 h-8 rounded flex items-center justify-center ${generateThumbnailColor(video.title)} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                          aria-label={`Play video: ${video.title}`}
                        >
                          <Play className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground line-clamp-1">
                            {video.title}
                          </div>
                          {video.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {video.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge 
                          variant={video.type === 'Required' ? 'destructive' : 'secondary'}
                          className="font-medium"
                        >
                          {video.type}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          <span className="font-medium">{video.assigned_to}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{video.completion_rate}%</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${video.completion_rate}%` }}
                              aria-label={`${video.completion_rate}% completion rate`}
                            />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <time dateTime={video.created_at}>
                          {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                        </time>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onEditVideo(video)}
                            aria-label={`Edit video: ${video.title}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDeleteConfirmVideo(video)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete video: ${video.title}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirmVideo} 
        onOpenChange={(open) => { 
          if (!open) setDeleteConfirmVideo(null); 
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Video</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to delete "{deleteConfirmVideo?.title}"?</p>
                <br />
                <p>This will permanently remove:</p>
                <ul className="list-disc list-inside mt-2 space-y-1" role="list">
                  <li>The video and all its content</li>
                  <li>Title and description</li>
                  <li>Its assignment as a required video for users</li>
                </ul>
                <br />
                <strong>This action cannot be undone.</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Video'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};