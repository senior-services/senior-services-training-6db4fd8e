/**
 * Accessible video table component for admin dashboard
 * Provides comprehensive video management with keyboard navigation and screen reader support
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { 
  Edit, 
  Trash2, 
  Video as VideoIcon, 
  Plus, 
  Play 
} from 'lucide-react';
import { Video } from '@/types';
import { VIDEO_CONFIG } from '@/constants';
import { 
  createButtonAriaProps, 
  announceToScreenReader 
} from '@/utils/accessibility';
import { cn } from '@/lib/utils';

interface VideoTableProps {
  videos: Video[];
  loading?: boolean;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onPlay: (video: Video) => void;
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
  onDelete,
  onPlay,
  onAddVideo,
  className,
}) => {
  const [sortColumn, setSortColumn] = useState<'title' | 'assigned_to'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<Video | null>(null);

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
        case 'assigned_to':
          comparison = a.assigned_to - b.assigned_to;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [videos, sortColumn, sortDirection]);

  /**
   * Handles sorting of video table
   */
  const handleSort = useCallback((column: 'title' | 'assigned_to') => {
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
   * Handles delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmVideo) return;
    
    try {
      await onDelete(deleteConfirmVideo);
      announceToScreenReader(`Video "${(deleteConfirmVideo as any).title}" has been deleted`);
    } catch (error) {
      announceToScreenReader(`Failed to delete video "${(deleteConfirmVideo as any).title}"`);
    } finally {
      setDeleteConfirmVideo(null);
    }
  }, [deleteConfirmVideo, onDelete]);

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
                      className="font-semibold p-0 h-auto hover:bg-transparent whitespace-nowrap"
                      onClick={() => handleSort('title')}
                      aria-label={`Sort by title ${sortColumn === 'title' ? 
                        (sortDirection === 'asc' ? 'descending' : 'ascending') : 
                        'ascending'
                      }`}
                    >
                      Title
                      {sortColumn === 'title' && (
                        <span className="ml-1" aria-hidden="true">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    <Button
                      variant="ghost"
                      className="font-semibold p-0 h-auto hover:bg-transparent whitespace-nowrap"
                      onClick={() => handleSort('assigned_to')}
                      aria-label="Sort by assigned employees"
                    >
                      Assigned To
                      {sortColumn === 'assigned_to' && (
                        <span className="ml-1" aria-hidden="true">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">Quiz</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
                      className="group hover:bg-muted/50 transition-colors"
                    >
                       {/* Video title and preview */}
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-3">
                          {/* Video preview */}
                          <div className="relative w-20 h-12 rounded-md overflow-hidden bg-muted">
                            {(() => {
                              // Check if it's a YouTube URL
                              const isYouTubeUrl = video.video_url && (
                                video.video_url.includes('youtube.com/watch') || 
                                video.video_url.includes('youtu.be/')
                              );
                              
                              // Extract YouTube video ID
                              const getYouTubeVideoId = (url: string) => {
                                const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                                return match ? match[1] : null;
                              };
                              
                              const youtubeVideoId = isYouTubeUrl && video.video_url ? getYouTubeVideoId(video.video_url) : null;
                              
                              if (isYouTubeUrl && youtubeVideoId) {
                                return (
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}?controls=0&modestbranding=1&rel=0`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    className="w-full h-full pointer-events-none"
                                  />
                                );
                              } else if (video.video_url && !isYouTubeUrl) {
                                return (
                                  <video 
                                    className="w-full h-full object-cover pointer-events-none"
                                    preload="metadata"
                                    muted
                                    onError={(e) => {
                                      // Fallback to thumbnail if video fails to load
                                      const target = e.target as HTMLVideoElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.classList.remove('hidden');
                                    }}
                                  >
                                    <source src={video.video_url} type="video/mp4" />
                                  </video>
                                );
                              } else if (video.thumbnail_url) {
                                return (
                                  <img 
                                    src={video.thumbnail_url}
                                    alt={`${video.title} thumbnail`}
                                    className="w-full h-full object-cover"
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
                                video.video_url || video.thumbnail_url ? 'hidden' : ''
                              )}
                            >
                              <Play className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <a
                              href={`/video/${video.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleVideoAction('Play video', video, () => {})}
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

                      {/* Assigned employees count */}
                      <TableCell className="text-center py-2">
                        <span className="font-medium">
                          {video.assigned_to}
                        </span>
                      </TableCell>

                      {/* Quiz status */}
                      <TableCell className="text-center py-2">
                        {video.has_quiz ? (
                          <Badge variant="default" className="text-xs">
                            Quiz
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No Quiz
                          </Badge>
                        )}
                      </TableCell>
                      {/* Action buttons */}
                      <TableCell className="text-right py-2">
                        <div 
                          className="flex justify-end space-x-2"
                          role="group"
                          aria-label={`Actions for video: ${video.title}`}
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVideoAction('Edit video', video, () => onEdit(video))}
                            aria-label={`Edit video: ${video.title}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setDeleteConfirmVideo(video);
                              announceToScreenReader(`Delete confirmation dialog opened for video: ${video.title}`);
                            }}
                            aria-label={`Delete video: ${video.title}`}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmVideo} onOpenChange={() => setDeleteConfirmVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{(deleteConfirmVideo as any)?.title}"?
              <br />
              <br />
              This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The video file and metadata</li>
                <li>All employee assignments for this video</li>
                <li>Any progress tracking data</li>
                <li>Associated quiz questions (if any)</li>
              </ul>
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
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