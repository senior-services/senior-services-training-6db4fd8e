/**
 * Accessible video table component for admin dashboard
 * Provides comprehensive video management with keyboard navigation and screen reader support
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { 
  Edit, 
  Video as VideoIcon, 
  Plus, 
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveFileId } from '@/utils/videoUtils';
import { Video } from '@/types';
import { VIDEO_CONFIG } from '@/constants';
import { 
  createButtonAriaProps, 
  announceToScreenReader 
} from '@/utils/accessibility';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VideoTableProps {
  videos: Video[];
  loading?: boolean;
  onEdit: (video: Video) => void;
  onPlay: (video: Video) => void;
  onDelete: (video: Video) => void;
  onAddVideo: () => void;
  className?: string;
}

/**
 * Generates consistent thumbnail color based on video title
 * @param title - Video title
 * @returns CSS class for background color
 */
const generateThumbnailColor = (title: string): string => {
  const colors = VIDEO_CONFIG.THUMBNAIL_COLORS;
  const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

/**
 * Video table component with accessibility features
 */
export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  loading = false,
  onEdit,
  onPlay,
  onDelete,
  onAddVideo,
  className,
}) => {
  const [sortColumn, setSortColumn] = useState<'title'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteVideo, setDeleteVideo] = useState<Video | null>(null);
  const { toast } = useToast();

  /**
   * Sorts videos based on current sort criteria
   */
  const sortedVideos = React.useMemo(() => {
    if (!videos.length) return videos;

    return [...videos].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [videos, sortColumn, sortDirection]);

  /**
   * Handles sorting of video table
   */
  const handleSort = useCallback((column: 'title') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }

    announceToScreenReader(
      `Videos sorted by ${column} in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`
    );
  }, [sortColumn, sortDirection]);

  /**
   * Handles video actions with accessibility announcements
   */
  const handleVideoAction = useCallback((
    action: string, 
    video: any, 
    callback: () => void
  ) => {
    announceToScreenReader(`${action}: ${video.title}`);
    callback();
  }, []);

  /**
   * Handles video deletion with confirmation
   */
  const handleDelete = useCallback(async () => {
    if (!deleteVideo) return;
    
    try {
      await onDelete(deleteVideo);
      toast({
        title: "Success",
        description: `Video "${deleteVideo.title}" has been deleted.`,
      });
      setDeleteVideo(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteVideo, onDelete, toast]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Training Videos</h3>
          <p className="text-muted-foreground">
            Manage your training content and track engagement
          </p>
        </div>
        
        <Button 
          onClick={onAddVideo}
          {...createButtonAriaProps('Add new training video')}
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Video
        </Button>
      </div>

      {/* Video table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Training videos management table">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('title')}
                      className={`text-xs uppercase text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-primary group ${
                        sortColumn === 'title' 
                          ? 'font-bold' 
                          : 'font-medium'
                      }`}
                    >
                      Video Title and Description
                      {sortColumn === 'title' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12">
                      <div className="space-y-4">
                        <LoadingSkeleton lines={1} className="h-16" />
                        <LoadingSkeleton lines={1} className="h-16" />
                        <LoadingSkeleton lines={1} className="h-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="space-y-3">
                    <VideoIcon 
                      className="w-12 h-12 text-muted-foreground mx-auto" 
                      aria-hidden="true"
                    />
                        <div>
                          <h4 className="font-medium text-foreground">
                            No videos found
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Add your first video to get started with training content.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={onAddVideo}
                          aria-label="Add your first training video"
                        >
                          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                          Add First Video
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedVideos.map((video, index) => (
                    <TableRow 
                      key={video.id}
                      className="group"
                    >
                       {/* Video title and preview */}
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-3">
                          {/* Video preview */}
                          <div className="relative w-20 h-12 rounded-md overflow-hidden bg-muted">
                            {(() => {
                              // Determine best thumbnail source
                              let thumbSrc: string | null = null;
                              if (video.thumbnail_url) {
                                thumbSrc = video.thumbnail_url;
                              } else if (video.video_url) {
                                if (isYouTubeUrl(video.video_url)) {
                                  const id = getYouTubeVideoId(video.video_url);
                                  if (id) thumbSrc = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                                } else if (isGoogleDriveUrl(video.video_url)) {
                                  const id = getGoogleDriveFileId(video.video_url);
                                  if (id) thumbSrc = `https://drive.google.com/thumbnail?id=${id}&sz=w400-h300`;
                                }
                              }

                              if (thumbSrc) {
                                return (
                                  <img
                                    src={thumbSrc}
                                    alt={`${video.title} thumbnail`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      // Fallback to colored placeholder if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.classList.remove('hidden');
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}
                            <div 
                              className={cn(
                                'absolute inset-0 flex items-center justify-center',
                                generateThumbnailColor(video.title),
                                (video.video_url || video.thumbnail_url) ? 'hidden' : ''
                              )}
                            >
                              <Play className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleVideoAction('Play video', video, () => onPlay(video));
                              }}
                              aria-label={`Play video: ${video.title}`}
                              className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group"
                            >
                              <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </div>
                          
                          {/* Video info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {video.title}
                            </p>
                            {video.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-left py-2">
                        <div 
                          className="flex gap-1"
                          role="group"
                          aria-label={`Actions for video: ${video.title}`}
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVideoAction('Edit video', video, () => onEdit(video))}
                            aria-label={`Edit video: ${video.title}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteVideo(video)}
                            aria-label={`Delete video: ${video.title}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Video count summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {videos.length === 0 
          ? 'No training videos available'
          : `${videos.length} training video${videos.length === 1 ? '' : 's'} available`
        }
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteVideo} onOpenChange={() => setDeleteVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteVideo?.title}"? This action cannot be undone and will remove all associated assignments and progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};