/**
 * Accessible video table component for admin dashboard
 * Provides comprehensive video management with keyboard navigation and screen reader support
 */

import React, { useState } from 'react';
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
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { Edit, Trash2, Play, Video, Plus } from 'lucide-react';
import { Video as VideoType } from '@/types';
import { VIDEO_CONFIG } from '@/constants';
import { 
  createTableAriaProps, 
  createButtonAriaProps, 
  announceToScreenReader 
} from '@/utils/accessibility';
import { cn } from '@/lib/utils';

interface VideoTableProps {
  videos: VideoType[];
  loading?: boolean;
  onEdit: (video: VideoType) => void;
  onDelete: (video: VideoType) => void;
  onPlay: (video: VideoType) => void;
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
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  /**
   * Handles column sorting
   */
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }

    // Announce sort change to screen readers
    announceToScreenReader(
      `Table sorted by ${column} in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`
    );
  };

  /**
   * Handles video actions with accessibility announcements
   */
  const handleVideoAction = (action: string, video: VideoType, callback: () => void) => {
    callback();
    announceToScreenReader(`${action} initiated for video: ${video.title}`);
  };

  /**
   * Sorts videos based on current sort settings
   */
  const sortedVideos = React.useMemo(() => {
    if (!videos.length) return videos;

    return [...videos].sort((a, b) => {
      const aValue = a[sortColumn as keyof VideoType] as string;
      const bValue = b[sortColumn as keyof VideoType] as string;
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [videos, sortColumn, sortDirection]);

  const tableAriaProps = createTableAriaProps(sortColumn, sortDirection);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with add button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Training Videos</h3>
          <p className="text-muted-foreground">
            Manage your training content library
          </p>
        </div>
        <Button
          onClick={onAddVideo}
          aria-label="Add new training video"
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="font-semibold p-0 h-auto hover:bg-transparent"
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
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      className="font-semibold p-0 h-auto hover:bg-transparent"
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
                  <TableHead className="text-center">Quiz</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <Video 
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
                      {/* Video title and thumbnail */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Video thumbnail */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'w-16 h-10 rounded-md p-0 flex items-center justify-center hover:opacity-80 transition-opacity',
                              generateThumbnailColor(video.title)
                            )}
                            onClick={() => handleVideoAction('Play video', video, () => onPlay(video))}
                            aria-label={`Play video: ${video.title}`}
                          >
                            <Play className="w-4 h-4 text-white" aria-hidden="true" />
                          </Button>
                          
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
                      <TableCell className="text-center">
                        <span className="font-medium">
                          {video.assigned_to}
                        </span>
                      </TableCell>

                      {/* Quiz indicator */}
                      <TableCell className="text-center">
                        {video.has_quiz ? (
                          <Badge variant="secondary" aria-label="Has quiz">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground" aria-label="No quiz">
                            No
                          </span>
                        )}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-right">
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
                            onClick={() => handleVideoAction('Delete video', video, () => onDelete(video))}
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
    </div>
  );
};